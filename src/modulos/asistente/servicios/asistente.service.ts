import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PERMISOS, validarPermiso } from '../../auth/utils/roles.util';
import { RecomendacionesService } from '../../recomendaciones/servicios/recomendaciones.service';
import { GeminiAsistenteService } from './gemini-asistente.service';
import { ConversacionService } from './conversacion.service';
import { BusquedaWebAsistenteService } from './busqueda-web-asistente.service';
import { ConsultaAsistenteDto } from '../dto/consulta-asistente.dto';

@Injectable()
export class AsistenteService {
  constructor(
    private readonly recomendacionesService: RecomendacionesService,
    private readonly geminiService: GeminiAsistenteService,
    private readonly conversacionService: ConversacionService,
    private readonly busquedaWebService: BusquedaWebAsistenteService,
  ) {}

  async consultar(data: ConsultaAsistenteDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_VER);
    const usuarioId = this.obtenerUsuarioId(usuarioAuth);
    const institucionId = this.obtenerInstitucionId(usuarioAuth);

    const terminos = this.recomendacionesService.extraerTerminos(data.pregunta);

    if (terminos.length === 0) {
      return {
        mensaje:
          'Puedo ayudarte a encontrar recursos. Intenta preguntarme por un tema, por ejemplo: fracciones, lectura crítica o ecuaciones.',
        busquedaSugerida: '',
        recursos: [],
        conversacionId: null,
        temas: [],
      };
    }

    const recomendaciones =
      await this.recomendacionesService.recomendarRecursos(
        { tema: data.pregunta, limite: '5' },
        usuarioAuth,
      );

    const recursos = recomendaciones.recursos;
    const fuentesWeb = await this.busquedaWebService.buscar(data.pregunta);
    let conversacionId = data.conversacionId;

    if (!conversacionId) {
      const conversacion = await this.conversacionService.crear(
        usuarioId,
        institucionId,
      );
      conversacionId = conversacion.id;
    }

    const historial = data.historial || [];
    const recursosContexto = recursos.map((r) => ({
      titulo: r.titulo,
      resumen: r.resumen,
      categoria: r.categoria,
      tipoRecurso: r.tipoRecurso,
    }));

    const prompt = this.construirPrompt(
      data.pregunta,
      historial,
      recursosContexto,
      fuentesWeb,
    );

    const respuestaGemini = await this.geminiService.llamarGemini(prompt);

    if (respuestaGemini) {
      const partes = respuestaGemini.split('---METADATA---');
      const textoRespuesta = partes[0].trim();
      let titulo = data.pregunta.slice(0, 80);
      let resumen = '';
      let temas: string[] = terminos;

      if (partes[1]) {
        try {
          const metadata = JSON.parse(partes[1].trim());
          titulo = metadata.titulo || titulo;
          resumen = metadata.resumen || '';
          temas = metadata.temas || terminos;
        } catch {
          // usar valores por defecto
        }
      }

      await this.conversacionService.actualizarResumen(
        conversacionId,
        usuarioId,
        { titulo, resumen, temas },
      );

      await this.conversacionService.registrarIntereses(usuarioId, temas);

      return {
        mensaje: textoRespuesta,
        busquedaSugerida: terminos.join(' '),
        recursos,
        fuentesWeb,
        conversacionId,
        temas,
      };
    }

    if (recursos.length === 0) {
      const mensaje =
        'No encontré recursos publicados relacionados con esa consulta dentro de tu alcance. Puedes intentar con otras palabras clave o revisar el repositorio.';

      await this.conversacionService.actualizarResumen(
        conversacionId,
        usuarioId,
        {
          titulo: data.pregunta.slice(0, 80),
          resumen: mensaje,
          temas: terminos,
        },
      );

      await this.conversacionService.registrarIntereses(usuarioId, terminos);

      return {
        mensaje,
        busquedaSugerida: terminos.join(' '),
        recursos: [],
        fuentesWeb,
        conversacionId,
        temas: terminos,
      };
    }

    const mensaje = `Encontré ${recursos.length} recurso${
      recursos.length === 1 ? '' : 's'
    } recomendado${recursos.length === 1 ? '' : 's'} para tu consulta.`;

    await this.conversacionService.actualizarResumen(
      conversacionId,
      usuarioId,
      { titulo: data.pregunta.slice(0, 80), resumen: mensaje, temas: terminos },
    );

    await this.conversacionService.registrarIntereses(usuarioId, terminos);

    return {
      mensaje,
      busquedaSugerida: terminos.join(' '),
      recursos,
      fuentesWeb,
      conversacionId,
      temas: terminos,
    };
  }

  private obtenerUsuarioId(usuarioAuth: any) {
    const usuarioId = Number(usuarioAuth?.id ?? usuarioAuth?.sub);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return usuarioId;
  }

  private obtenerInstitucionId(usuarioAuth: any) {
    const institucionId = Number(usuarioAuth?.institucionId);

    if (!Number.isInteger(institucionId) || institucionId <= 0) {
      throw new UnauthorizedException('Institución no válida para el usuario');
    }

    return institucionId;
  }

  private construirPrompt(
    pregunta: string,
    historial: { rol: string; contenido: string }[],
    recursos: any[],
    fuentesWeb: { titulo: string; resumen: string; fuente: string | null }[],
  ) {
    const historialTexto = historial
      .map(
        (m) =>
          `${m.rol === 'usuario' ? 'Estudiante' : 'Tutor'}: ${m.contenido}`,
      )
      .join('\n');

    const recursosTexto =
      recursos.length > 0
        ? recursos
            .map(
              (r) =>
                `- "${r.titulo}" (${r.categoria || 'Sin categoría'}, ${r.tipoRecurso || 'General'}): ${r.resumen || 'Sin resumen disponible'}`,
            )
            .join('\n')
        : 'No se encontraron recursos específicos en el repositorio para esta consulta.';

    const fuentesWebTexto =
      fuentesWeb.length > 0
        ? fuentesWeb
            .map(
              (fuente) =>
                `- "${fuente.titulo}" (${fuente.fuente || 'fuente web'}): ${fuente.resumen || 'Sin descripción disponible'}`,
            )
            .join('\n')
        : 'No hay fuentes web verificadas disponibles para esta consulta.';

    return `Eres NEXORA AI, un tutor académico experto, motivador y con experiencia en pedagogía. Tu misión es ayudar al estudiante a comprender conceptos educativos usando un lenguaje claro, ejemplos prácticos y un tono amigable.

CONTEXTO - Recursos disponibles en el repositorio:
${recursosTexto}

CONTEXTO - Fuentes web encontradas:
${fuentesWebTexto}

HISTORIAL de la conversación:
${historialTexto || 'No hay historial previo. Esta es una nueva conversación.'}

PREGUNTA actual del estudiante:
"${pregunta}"

INSTRUCCIONES:
- Responde de forma clara, educativa y apropiada para el nivel escolar del estudiante.
- Si hay recursos del repositorio disponibles, úsalos como base fundamental para tu respuesta y recomiéndalos.
- Si hay fuentes web disponibles, úsalas como apoyo secundario y menciónalas de forma natural.
- Si no hay recursos específicos ni fuentes web, responde con tu conocimiento pero sugiere al estudiante buscar más en el repositorio.
- Mantén un tono amigable, motivador y profesional.
- Si el estudiante pide ejercicios, práctica o un quiz, genera preguntas relevantes con sus respuestas.
- Usa formato markdown para estructurar tu respuesta (negritas, listas, tablas si aplica).

ADEMÁS, al final de tu respuesta, agrega exactamente esto en una línea separada:
---METADATA---
{"titulo": "máximo 8 palabras sobre el tema principal", "resumen": "máximo 20 palabras describiendo la consulta", "temas": ["tema1", "tema2", "tema3"]}

Donde "temas" son 2-5 palabras clave representativas en minúscula y sin acentos.`;
  }
}
