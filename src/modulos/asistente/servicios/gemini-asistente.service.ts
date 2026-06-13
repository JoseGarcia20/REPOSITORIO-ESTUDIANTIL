import { Injectable } from '@nestjs/common';

@Injectable()
export class GeminiAsistenteService {
  async llamarGemini(prompt: string): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }

    const modelo = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.5,
            },
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const texto = this.extraerTextoGemini(data);
      if (!texto) {
        return null;
      }

      return texto.trim();
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extraerTextoGemini(data: any) {
    return (
      data?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text || '')
        .join('') || ''
    ).trim();
  }
}
