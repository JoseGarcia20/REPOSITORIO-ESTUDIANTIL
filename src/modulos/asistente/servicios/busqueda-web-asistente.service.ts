import { Injectable } from '@nestjs/common';

export type FuenteWebAsistente = {
  titulo: string;
  enlace: string;
  resumen: string;
  fuente: string | null;
};

@Injectable()
export class BusquedaWebAsistenteService {
  async buscar(consulta: string, limite = 4): Promise<FuenteWebAsistente[]> {
    const key = process.env.GOOGLE_SEARCH_API_KEY?.trim();
    const cx = process.env.GOOGLE_SEARCH_CX?.trim();

    if (!key || !cx) {
      return [];
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.set('key', key);
      url.searchParams.set('cx', cx);
      url.searchParams.set('q', `${consulta} explicación educativa`);
      url.searchParams.set('num', String(Math.min(Math.max(limite, 1), 10)));
      url.searchParams.set('lr', 'lang_es');
      url.searchParams.set('safe', 'active');

      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (data.items || [])
        .map((item: any) => ({
          titulo: String(item.title || '').trim(),
          enlace: String(item.link || '').trim(),
          resumen: String(item.snippet || '').trim(),
          fuente: this.obtenerFuente(item.link),
        }))
        .filter((item: FuenteWebAsistente) => item.titulo && item.enlace)
        .slice(0, limite);
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  private obtenerFuente(enlace?: string) {
    if (!enlace) {
      return null;
    }

    try {
      return new URL(enlace).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  }
}
