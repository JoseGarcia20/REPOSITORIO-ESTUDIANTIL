import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { createWriteStream, existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { basename, extname, join } from 'path';
import { jsonrepair } from 'jsonrepair';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import {
  PERMISOS,
  tieneAccesoTotal,
  validarPermiso,
} from '../../auth/utils/roles.util';
import { RecursoService } from '../../recursos/servicios/recurso.service';
import {
  GenerarMaterialIaDto,
  type ExtensionMaterialIa,
  type TipoMaterialIa,
} from '../dto/generar-material-ia.dto';
import { GuardarMaterialIaDto } from '../dto/guardar-material-ia.dto';

type FuenteIa = {
  titulo: string;
  url: string;
};

type SeccionMaterialIa = {
  titulo: string;
  contenido: string;
};

type MaterialIa = {
  titulo: string;
  tema: string;
  gradoEscolarId: string;
  gradoEscolar: string;
  categoriaId?: string;
  categoria?: string;
  tipoMaterial: TipoMaterialIa;
  extension: ExtensionMaterialIa;
  introduccion: string;
  objetivos: string[];
  conceptosClave: string[];
  secciones: SeccionMaterialIa[];
  actividadClase: string;
  preguntasComprension: string[];
  cierre: string;
  palabrasClave: string[];
  fuentes: FuenteIa[];
  busquedas: string[];
  modelo: string;
  generadoEn: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    groundingMetadata?: {
      webSearchQueries?: string[];
      groundingChunks?: Array<{
        web?: {
          uri?: string;
          title?: string;
        };
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

@Injectable()
export class PreparadorIaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recursoService: RecursoService,
  ) {}

  async obtenerCatalogos(usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.PREPARADOR_IA_USAR);
    const esSuper = tieneAccesoTotal(usuarioAuth);
    const institucionId = Number(usuarioAuth?.institucionId || 0);

    const [instituciones, categorias, gradosEscolares, tiposRecursos] =
      await Promise.all([
        esSuper
          ? this.prisma.institucion.findMany({
              where: { estado: true },
              select: { id: true, nombre: true },
              orderBy: { nombre: 'asc' },
            })
          : Promise.resolve([]),
        this.prisma.categoria.findMany({
          where: {
            estado: true,
            ...(esSuper ? {} : { institucionId }),
          },
          select: {
            id: true,
            nombre: true,
            institucionId: true,
            institucion: { select: { id: true, nombre: true } },
          },
          orderBy: { nombre: 'asc' },
        }),
        this.prisma.gradoEscolar.findMany({
          where: { estado: true },
          select: { id: true, nombre: true, codigo: true, orden: true },
          orderBy: { orden: 'asc' },
        }),
        this.prisma.tipoRecurso.findMany({
          where: { estado: true },
          select: { id: true, nombre: true },
          orderBy: { nombre: 'asc' },
        }),
      ]);

    return {
      instituciones,
      categorias,
      gradosEscolares,
      tiposRecursos,
    };
  }

  async generarMaterial(data: GenerarMaterialIaDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.PREPARADOR_IA_USAR);
    const contexto = await this.obtenerContexto(data, usuarioAuth, false);
    const tipoMaterial = data.tipoMaterial || 'guia_clase';
    const extension = data.extension || 'normal';
    const modelo = this.obtenerModeloGemini();
    const prompt = this.construirPrompt({
      ...data,
      tipoMaterial,
      extension,
      gradoEscolar: contexto.gradoEscolar.nombre,
      categoria: contexto.categoria?.nombre,
    });
    const respuesta = await this.llamarGeminiConBusqueda(prompt, modelo);
    const fuentes = this.extraerFuentesGemini(respuesta);
    const busquedas = this.extraerBusquedasGemini(respuesta);
    const texto = this.extraerTextoGemini(respuesta);
    const material = this.normalizarMaterial(
      texto,
      {
        ...data,
        tipoMaterial,
        extension,
        gradoEscolar: contexto.gradoEscolar.nombre,
        categoria: contexto.categoria?.nombre,
      },
      fuentes,
      busquedas,
      modelo,
    );

    return material;
  }

  async guardarMaterial(data: GuardarMaterialIaDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.PREPARADOR_IA_USAR);
    const contexto = await this.obtenerContexto(data, usuarioAuth, true);
    const material = this.construirMaterialDesdeDto(data, contexto);
    if (!contexto.institucion) {
      throw new BadRequestException(
        'Debe seleccionar la institución para guardar el material.',
      );
    }
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: Number(usuarioAuth?.sub || 0) },
      select: { id: true, nombres: true, apellidos: true, correo: true },
    });

    const archivo = await this.generarPdf(material, {
      institucion: contexto.institucion,
      generadoPor: this.nombreUsuario(usuario),
    });
    const recurso = await this.recursoService.crearDesdeAulaColaborativa(
      {
        titulo: material.titulo,
        palabrasClave: material.palabrasClave.slice(0, 6).join(', '),
        contenidoResumen: this.construirResumenRepositorio(material),
        rutaRecurso: archivo.rutaPublica,
        fuente: this.construirFuenteRepositorio(material.fuentes),
        autorNombre: `Preparador IA - ${this.nombreUsuario(usuario)}`,
        nivelAcademico: contexto.gradoEscolar.nombre,
        gradoEscolarId: contexto.gradoEscolar.id,
        publicado: data.publicado ?? true,
        institucionId: contexto.institucion.id,
        categoriaId: contexto.categoria?.id,
        tipoRecursoId: this.numeroPositivo(data.tipoRecursoId) || undefined,
        usuarioCreadorId: Number(usuarioAuth?.sub),
      },
      usuarioAuth,
    );

    return {
      mensaje: 'Material guardado en el repositorio.',
      archivo,
      recurso,
    };
  }

  private async obtenerContexto(
    data: Pick<
      GenerarMaterialIaDto | GuardarMaterialIaDto,
      'gradoEscolarId' | 'categoriaId' | 'institucionId'
    >,
    usuarioAuth: any,
    requiereInstitucion: boolean,
  ) {
    const gradoEscolarId = this.numeroPositivo(data.gradoEscolarId);

    if (!gradoEscolarId) {
      throw new BadRequestException('Debe seleccionar el grado escolar.');
    }

    const institucionIdSolicitada = this.numeroPositivo(data.institucionId);
    const institucionId = tieneAccesoTotal(usuarioAuth)
      ? institucionIdSolicitada
      : Number(usuarioAuth?.institucionId || 0);

    if (requiereInstitucion && !institucionId) {
      throw new BadRequestException(
        'Debe seleccionar la institución para guardar el material.',
      );
    }

    if (
      institucionIdSolicitada &&
      !tieneAccesoTotal(usuarioAuth) &&
      institucionIdSolicitada !== Number(usuarioAuth?.institucionId)
    ) {
      throw new ForbiddenException(
        'No tiene permisos para usar otra institución.',
      );
    }

    const categoriaId = this.numeroPositivo(data.categoriaId);
    const [gradoEscolar, institucion, categoria] = await Promise.all([
      this.prisma.gradoEscolar.findFirst({
        where: { id: gradoEscolarId, estado: true },
      }),
      institucionId
        ? this.prisma.institucion.findFirst({
            where: { id: institucionId, estado: true },
          })
        : Promise.resolve(null),
      categoriaId
        ? this.prisma.categoria.findFirst({
            where: {
              id: categoriaId,
              estado: true,
              ...(institucionId ? { institucionId } : {}),
            },
          })
        : Promise.resolve(null),
    ]);

    if (!gradoEscolar) {
      throw new BadRequestException('El grado escolar seleccionado no existe.');
    }

    if (requiereInstitucion && !institucion) {
      throw new BadRequestException('La institución seleccionada no existe.');
    }

    if (categoriaId && !categoria) {
      throw new BadRequestException(
        'La categoría seleccionada no pertenece a la institución.',
      );
    }

    return {
      gradoEscolar,
      institucion,
      categoria,
    };
  }

  private construirPrompt(
    data: GenerarMaterialIaDto & {
      gradoEscolar: string;
      categoria?: string;
      tipoMaterial: TipoMaterialIa;
      extension: ExtensionMaterialIa;
    },
  ) {
    const longitud = {
      breve: 'entre 600 y 900 palabras',
      normal: 'entre 1000 y 1500 palabras',
      extenso: 'entre 1800 y 2600 palabras',
    }[data.extension];
    const tipo = this.etiquetaTipoMaterial(data.tipoMaterial);
    const reglasTipo = this.construirReglasPorTipoMaterial(data);
    const reglasMatematicas = this.construirReglasMatematicas(data);
    const indicacionesAdicionales = data.instruccionesAdicionales || 'Ninguna';

    return `
Actua como un docente experto en didactica escolar. Usa busqueda web para fundamentar el contenido con fuentes confiables y actuales cuando sea util.

Necesito crear un material academico para clase.

Tema: ${data.tema}
Grado escolar: ${data.gradoEscolar}
Area o categoria: ${data.categoria || 'No especificada'}
Tipo de material: ${tipo}
Extension requerida: ${longitud}
Indicaciones adicionales: ${indicacionesAdicionales}

Adapta el lenguaje al grado indicado. Evita copiar texto literal de fuentes web. Sintetiza con tus propias palabras, conserva precision conceptual y prepara contenido listo para usar en clase.
${reglasTipo}
${reglasMatematicas}

Devuelve exclusivamente un JSON valido con esta estructura:
{
  "titulo": "string",
  "introduccion": "string",
  "objetivos": ["string"],
  "conceptosClave": ["string"],
  "secciones": [
    { "titulo": "string", "contenido": "string" }
  ],
  "actividadClase": "string",
  "preguntasComprension": ["string"],
  "cierre": "string",
  "palabrasClave": ["string"]
}

Reglas obligatorias de formato JSON:
- Responder solo con el objeto JSON, sin markdown ni texto adicional.
- Si incluyes notacion LaTeX, escapar la barra invertida con doble barra (ejemplo: \\\\frac{a}{b}).
- Escapar saltos de linea como \\n dentro de strings JSON.
`;
  }

  private construirReglasPorTipoMaterial(
    data: GenerarMaterialIaDto & {
      tipoMaterial: TipoMaterialIa;
    },
  ) {
    if (!['taller', 'evaluacion'].includes(data.tipoMaterial)) {
      return `
Reglas de contenido:
- El material debe ser didactico y claro para el grado indicado.
- Los ejercicios o actividades deben mantener coherencia con el objetivo de aprendizaje.
`;
    }

    const adicionales = this.normalizarTexto(data.instruccionesAdicionales);
    const pidioAyudas = [
      'pista',
      'pistas',
      'solucion',
      'soluciones',
      'resuelto',
      'resueltos',
      'paso a paso',
      'procedimiento',
      'explica',
      'explicacion',
      'guia',
      'guía',
    ].some((token) => adicionales.includes(token));
    const tipo = data.tipoMaterial === 'taller' ? 'taller' : 'evaluacion';

    return `
Reglas obligatorias para este ${tipo}:
- Debe simular un instrumento evaluativo real con enunciados exigentes y verificables.
- No incluir solucionario, respuestas correctas, procedimientos ni ejemplos resueltos.
- No incluir pistas, contexto de resolucion ni orientaciones de como hacer cada ejercicio.
${
  pidioAyudas
    ? '- Excepcion: solo porque fue solicitado en indicaciones adicionales, agrega una seccion final breve llamada "Apoyos solicitados".'
    : '- Mantener todo el contenido estrictamente evaluativo, sin ayudas.'
}
`;
  }

  private construirReglasMatematicas(
    data: GenerarMaterialIaDto & {
      tema: string;
      categoria?: string;
    },
  ) {
    const esTemaMatematico = this.esTemaMatematico(data.tema, data.categoria);
    const adicionales = this.normalizarTexto(data.instruccionesAdicionales);
    const pidioFormulas = [
      'formula',
      'formulas',
      'fórmula',
      'fórmulas',
      'ecuacion',
      'ecuaciones',
      'ecuación',
      'ecuaciones',
      'latex',
      'notacion',
      'notación',
      'funcion',
      'función',
    ].some((token) => adicionales.includes(token));

    if (!esTemaMatematico) {
      return '';
    }

    return `
Reglas para contenido matematico:
${
  pidioFormulas
    ? '- Incluir formulas y funciones en notacion LaTeX, usando $...$ para linea y $$...$$ para bloque.'
    : '- No incluir formulas base, pistas matematicas ni pasos de resolucion, salvo que se soliciten de forma explicita en indicaciones adicionales.'
}
- Si el material es evaluativo, priorizar enunciados para resolver sin revelar la estrategia.
`;
  }

  private async llamarGeminiConBusqueda(prompt: string, modelo: string) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'No hay GEMINI_API_KEY configurada para generar materiales con IA.',
      );
    }

    const timeoutMs = this.enteroEnv('GEMINI_PREPARADOR_TIMEOUT_MS', 120000);
    const intentos = this.enteroEnv('GEMINI_MAX_ATTEMPTS', 3);
    let ultimoError = '';

    for (let intento = 1; intento <= intentos; intento += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const respuesta = await fetch(this.urlGemini(modelo), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(this.payloadGemini(prompt)),
          signal: controller.signal,
        });

        if (!respuesta.ok) {
          const detalle = await respuesta.text();
          ultimoError = `Gemini respondió con estado ${respuesta.status}${
            detalle ? `: ${detalle.slice(0, 300)}` : ''
          }`;

          if (
            intento < intentos &&
            this.esEstadoReintentable(respuesta.status)
          ) {
            await this.esperar(this.demoraReintento(intento));
            continue;
          }

          throw new ServiceUnavailableException(ultimoError);
        }

        const data = (await respuesta.json()) as GeminiResponse;
        const texto = this.extraerTextoGemini(data);

        if (!texto.trim()) {
          throw new ServiceUnavailableException(
            'Gemini no generó contenido para el material.',
          );
        }

        return data;
      } catch (error) {
        ultimoError = this.obtenerMensajeError(error);

        if (intento < intentos && this.esMensajeReintentable(ultimoError)) {
          await this.esperar(this.demoraReintento(intento));
          continue;
        }

        throw new ServiceUnavailableException(
          `No se pudo generar el material con Gemini: ${ultimoError}`,
        );
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new ServiceUnavailableException(
      `No se pudo generar el material con Gemini: ${ultimoError}`,
    );
  }

  private payloadGemini(prompt: string) {
    return {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      tools: [
        {
          google_search: {},
        },
      ],
      generationConfig: {
        temperature: 0.35,
        topP: 0.9,
        maxOutputTokens: this.enteroEnv(
          'GEMINI_PREPARADOR_MAX_OUTPUT_TOKENS',
          8192,
        ),
      },
    };
  }

  private urlGemini(modeloGemini: string) {
    const modelo = modeloGemini.replace(/^models\//, '');
    return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      modelo,
    )}:generateContent`;
  }

  private extraerTextoGemini(data: GeminiResponse) {
    if (data.error?.message) {
      throw new ServiceUnavailableException(data.error.message);
    }

    return (
      data.candidates?.[0]?.content?.parts
        ?.map((parte) => parte.text || '')
        .join('') || ''
    );
  }

  private extraerFuentesGemini(data: GeminiResponse): FuenteIa[] {
    const chunks =
      data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const fuentes = chunks
      .map((chunk) => ({
        titulo: chunk.web?.title?.trim() || 'Fuente web',
        url: chunk.web?.uri?.trim() || '',
      }))
      .filter((fuente) => fuente.url);

    return this.deduplicarFuentes(fuentes).slice(0, 8);
  }

  private extraerBusquedasGemini(data: GeminiResponse) {
    return Array.from(
      new Set(
        data.candidates?.[0]?.groundingMetadata?.webSearchQueries
          ?.map((item) => item.trim())
          .filter(Boolean) || [],
      ),
    ).slice(0, 6);
  }

  private normalizarMaterial(
    textoGemini: string,
    data: GenerarMaterialIaDto & {
      gradoEscolar: string;
      categoria?: string;
      tipoMaterial: TipoMaterialIa;
      extension: ExtensionMaterialIa;
    },
    fuentes: FuenteIa[],
    busquedas: string[],
    modelo: string,
  ): MaterialIa {
    const payload = this.parsearJsonGemini(textoGemini);
    const titulo = this.textoCorto(
      payload?.titulo,
      `${this.etiquetaTipoMaterial(data.tipoMaterial)}: ${data.tema}`,
      180,
    );

    return {
      titulo,
      tema: data.tema.trim(),
      gradoEscolarId: String(data.gradoEscolarId),
      gradoEscolar: data.gradoEscolar,
      categoriaId: data.categoriaId ? String(data.categoriaId) : undefined,
      categoria: data.categoria,
      tipoMaterial: data.tipoMaterial,
      extension: data.extension,
      introduccion: this.textoLargo(
        payload?.introduccion,
        this.textoPlanoDesdeGemini(textoGemini),
      ),
      objetivos: this.listaTexto(payload?.objetivos, [
        `Comprender los aspectos principales de ${data.tema}.`,
        'Relacionar el tema con situaciones cercanas al contexto escolar.',
      ]),
      conceptosClave: this.listaTexto(payload?.conceptosClave, [
        data.tema.trim(),
      ]),
      secciones: this.seccionesTexto(payload?.secciones, textoGemini),
      actividadClase: this.textoLargo(
        payload?.actividadClase,
        'Realizar una socialización guiada del tema y construir una síntesis grupal con ejemplos.',
      ),
      preguntasComprension: this.listaTexto(payload?.preguntasComprension, [
        `¿Qué ideas principales se pueden explicar sobre ${data.tema}?`,
        '¿Cómo se puede aplicar este tema en una situación cotidiana?',
      ]),
      cierre: this.textoLargo(
        payload?.cierre,
        'Cierre la clase retomando los conceptos centrales y resolviendo dudas de los estudiantes.',
      ),
      palabrasClave: this.listaTexto(payload?.palabrasClave, [data.tema]).slice(
        0,
        8,
      ),
      fuentes,
      busquedas,
      modelo,
      generadoEn: new Date().toISOString(),
    };
  }

  private construirMaterialDesdeDto(
    data: GuardarMaterialIaDto,
    contexto: Awaited<ReturnType<PreparadorIaService['obtenerContexto']>>,
  ): MaterialIa {
    return {
      titulo: data.titulo.trim(),
      tema: data.tema.trim(),
      gradoEscolarId: String(contexto.gradoEscolar.id),
      gradoEscolar: contexto.gradoEscolar.nombre,
      categoriaId: contexto.categoria?.id ? String(contexto.categoria.id) : '',
      categoria: contexto.categoria?.nombre,
      tipoMaterial: data.tipoMaterial,
      extension: data.extension,
      introduccion: data.introduccion.trim(),
      objetivos: this.listaTexto(data.objetivos),
      conceptosClave: this.listaTexto(data.conceptosClave),
      secciones: this.seccionesTexto(data.secciones),
      actividadClase: data.actividadClase.trim(),
      preguntasComprension: this.listaTexto(data.preguntasComprension),
      cierre: data.cierre.trim(),
      palabrasClave: this.listaTexto(data.palabrasClave).slice(0, 8),
      fuentes: this.deduplicarFuentes(data.fuentes || []),
      busquedas: [],
      modelo: this.obtenerModeloGemini(),
      generadoEn: new Date().toISOString(),
    };
  }

  private async generarPdf(
    material: MaterialIa,
    contexto: {
      institucion: NonNullable<
        Awaited<
          ReturnType<PreparadorIaService['obtenerContexto']>
        >['institucion']
      >;
      generadoPor: string;
    },
  ) {
    const carpeta = join(process.cwd(), 'uploads', 'recursos', 'ia-clases');
    await mkdir(carpeta, { recursive: true });

    const nombreArchivo = `${Date.now()}-${this.slug(material.titulo)}.pdf`;
    const rutaArchivo = join(carpeta, nombreArchivo);
    const rutaPublica = `/uploads/recursos/ia-clases/${nombreArchivo}`;

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        bufferPages: true,
        margins: { top: 54, left: 54, right: 54, bottom: 54 },
        info: {
          Title: material.titulo,
          Author: contexto.generadoPor,
          Subject: material.tema,
        },
      });
      const stream = createWriteStream(rutaArchivo);

      stream.on('finish', resolve);
      stream.on('error', reject);
      doc.on('error', reject);
      doc.pipe(stream);
      this.escribirPdf(doc, material, contexto);
      doc.end();
    });

    return {
      nombreArchivo,
      rutaPublica,
      mimeType: 'application/pdf',
    };
  }

  private escribirPdf(
    doc: PDFKit.PDFDocument,
    material: MaterialIa,
    contexto: {
      institucion: {
        nombre: string;
        nit?: string | null;
        ciudad?: string | null;
        departamento?: string | null;
        logo?: string | null;
      };
      generadoPor: string;
    },
  ) {
    const ancho =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const logoPath = this.rutaLogoLocal(contexto.institucion.logo);

    if (logoPath) {
      try {
        doc.image(logoPath, doc.page.margins.left, 44, {
          fit: [64, 64],
        });
      } catch {
        doc.rect(doc.page.margins.left, 44, 54, 54).stroke('#d1d5db');
      }
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#111827')
      .text(contexto.institucion.nombre, logoPath ? 130 : 54, 50, {
        width: logoPath ? ancho - 76 : ancho,
      });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#4b5563')
      .text(
        [
          contexto.institucion.nit ? `NIT ${contexto.institucion.nit}` : '',
          [contexto.institucion.ciudad, contexto.institucion.departamento]
            .filter(Boolean)
            .join(', '),
        ]
          .filter(Boolean)
          .join(' · '),
        { width: logoPath ? ancho - 76 : ancho },
      )
      .moveDown(2);

    doc
      .moveTo(54, doc.y)
      .lineTo(doc.page.width - 54, doc.y)
      .strokeColor('#d1d5db')
      .stroke()
      .moveDown(1.4);

    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#111827')
      .text(material.titulo, { width: ancho })
      .moveDown(0.4);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#4b5563')
      .text(`Tema: ${material.tema}`)
      .text(`Grado: ${material.gradoEscolar}`)
      .text(
        `Tipo de material: ${this.etiquetaTipoMaterial(material.tipoMaterial)}`,
      )
      .text(`Generado por: ${contexto.generadoPor}`)
      .text(`Fecha: ${new Intl.DateTimeFormat('es-CO').format(new Date())}`)
      .moveDown(1.5);

    this.seccionPdf(doc, 'Introducción', material.introduccion);
    this.listaPdf(doc, 'Objetivos de aprendizaje', material.objetivos);
    this.listaPdf(doc, 'Conceptos clave', material.conceptosClave);

    material.secciones.forEach((seccion) => {
      this.seccionPdf(doc, seccion.titulo, seccion.contenido);
    });

    this.seccionPdf(doc, 'Actividad para clase', material.actividadClase);
    this.listaPdf(
      doc,
      'Preguntas de comprensión',
      material.preguntasComprension,
    );
    this.seccionPdf(doc, 'Cierre sugerido', material.cierre);

    if (material.fuentes.length > 0) {
      this.tituloPdf(doc, 'Fuentes consultadas');
      material.fuentes.forEach((fuente, index) => {
        this.saltoSiNecesario(doc, 44);
        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor('#111827')
          .text(`${index + 1}. ${fuente.titulo}`, { width: ancho });
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor('#2563eb')
          .text(fuente.url, { width: ancho, link: fuente.url, underline: true })
          .moveDown(0.4);
      });
    }

    const paginas = doc.bufferedPageRange();
    for (let i = paginas.start; i < paginas.start + paginas.count; i += 1) {
      doc.switchToPage(i);
      const footerY = doc.page.height - doc.page.margins.bottom - 10;
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#6b7280')
        .text(
          `Página ${i + 1} · Material generado con apoyo de IA y revisable por el docente`,
          54,
          footerY,
          {
            width: ancho,
            align: 'center',
            lineBreak: false,
          },
        );
    }
  }

  private tituloPdf(doc: PDFKit.PDFDocument, titulo: string) {
    this.saltoSiNecesario(doc, 56);
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#0f172a')
      .text(titulo)
      .moveDown(0.35);
  }

  private seccionPdf(
    doc: PDFKit.PDFDocument,
    titulo: string,
    contenido: string,
  ) {
    this.tituloPdf(doc, titulo);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1f2937')
      .text(contenido, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        lineGap: 2,
      })
      .moveDown(0.9);
  }

  private listaPdf(doc: PDFKit.PDFDocument, titulo: string, items: string[]) {
    this.tituloPdf(doc, titulo);
    items.forEach((item) => {
      this.saltoSiNecesario(doc, 28);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#1f2937')
        .text(`- ${item}`, {
          width:
            doc.page.width - doc.page.margins.left - doc.page.margins.right,
          lineGap: 2,
        });
    });
    doc.moveDown(0.9);
  }

  private saltoSiNecesario(doc: PDFKit.PDFDocument, espacio: number) {
    if (doc.y + espacio > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  }

  private rutaLogoLocal(logo?: string | null) {
    if (!logo || !logo.startsWith('/uploads/')) {
      return '';
    }

    const ruta = join(process.cwd(), logo.replace(/^\//, ''));
    const extension = extname(ruta).toLowerCase();

    return existsSync(ruta) && ['.png', '.jpg', '.jpeg'].includes(extension)
      ? ruta
      : '';
  }

  private parsearJsonGemini(texto: string) {
    const limpio = this.textoPlanoDesdeGemini(texto);
    const candidatos = [limpio, this.extraerObjetoJson(limpio)].filter(
      (item): item is string => Boolean(item && item.trim()),
    );

    for (const candidato of candidatos) {
      try {
        return JSON.parse(candidato);
      } catch {
        try {
          const reparado = jsonrepair(candidato);
          return JSON.parse(reparado);
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  private textoPlanoDesdeGemini(texto: string) {
    return texto
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
  }

  private extraerObjetoJson(texto: string) {
    const inicio = texto.indexOf('{');
    const fin = texto.lastIndexOf('}');

    if (inicio < 0 || fin <= inicio) {
      return '';
    }

    return texto.slice(inicio, fin + 1).trim();
  }

  private seccionesTexto(valor: any, textoFallback = ''): SeccionMaterialIa[] {
    if (Array.isArray(valor)) {
      const secciones = valor
        .map((item) => ({
          titulo: this.textoCorto(item?.titulo, 'Desarrollo', 120),
          contenido: this.textoLargo(item?.contenido, ''),
        }))
        .filter((item) => item.contenido);

      if (secciones.length > 0) {
        return secciones.slice(0, 8);
      }
    }

    const fallback = this.textoPlanoDesdeGemini(textoFallback);
    return [
      {
        titulo: 'Desarrollo del tema',
        contenido:
          fallback ||
          'El contenido principal se desarrollará con ejemplos y explicación guiada.',
      },
    ];
  }

  private listaTexto(valor: any, fallback: string[] = []) {
    const lista = Array.isArray(valor)
      ? valor
      : typeof valor === 'string'
        ? valor.split(/\n|;/)
        : fallback;

    return lista
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  private textoCorto(valor: any, fallback: string, maximo: number) {
    const texto = String(valor || fallback || '')
      .replace(/\s+/g, ' ')
      .trim();

    return texto.length > maximo ? `${texto.slice(0, maximo - 3)}...` : texto;
  }

  private textoLargo(valor: any, fallback: string) {
    return String(valor || fallback || '')
      .replace(/\r/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private construirResumenRepositorio(material: MaterialIa) {
    return [
      material.introduccion,
      material.objetivos.length > 0
        ? `Objetivos: ${material.objetivos.join('; ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n')
      .slice(0, 1200);
  }

  private construirFuenteRepositorio(fuentes: FuenteIa[]) {
    return fuentes.length > 0
      ? fuentes
          .slice(0, 3)
          .map((fuente) => fuente.titulo || basename(fuente.url))
          .join(', ')
      : 'Gemini con búsqueda web';
  }

  private deduplicarFuentes(fuentes: FuenteIa[]) {
    const vistas = new Set<string>();

    return fuentes
      .map((fuente) => ({
        titulo: this.textoCorto(fuente.titulo, 'Fuente web', 180),
        url: String(fuente.url || '').trim(),
      }))
      .filter((fuente) => {
        if (!fuente.url || vistas.has(fuente.url)) {
          return false;
        }

        vistas.add(fuente.url);
        return true;
      });
  }

  private etiquetaTipoMaterial(tipo: string) {
    const etiquetas: Record<string, string> = {
      guia_clase: 'Guía de clase',
      taller: 'Taller',
      lectura: 'Lectura guiada',
      evaluacion: 'Actividad evaluativa',
      resumen: 'Resumen académico',
    };

    return etiquetas[tipo] || tipo;
  }

  private normalizarTexto(valor?: string | null) {
    return (valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private esTemaMatematico(tema: string, categoria?: string) {
    const texto = this.normalizarTexto(`${tema || ''} ${categoria || ''}`);
    const pistas = [
      'matemat',
      'algebra',
      'geometr',
      'trigonometr',
      'calculo',
      'aritmet',
      'estadistic',
      'probabilidad',
      'ecuacion',
      'fraccion',
      'funcion',
      'derivada',
      'integral',
      'polinomio',
      'logaritmo',
      'sistema de ecuaciones',
    ];

    return pistas.some((pista) => texto.includes(pista));
  }

  private obtenerModeloGemini() {
    return (
      process.env.GEMINI_PREPARADOR_MODEL ||
      process.env.GEMINI_MODEL ||
      'gemini-2.5-flash'
    ).trim();
  }

  private numeroPositivo(valor?: string | number | null) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : null;
  }

  private enteroEnv(nombre: string, fallback: number) {
    const valor = Number(process.env[nombre]);
    return Number.isInteger(valor) && valor > 0 ? valor : fallback;
  }

  private esperar(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private demoraReintento(intento: number) {
    const base = this.enteroEnv('GEMINI_RETRY_DELAY_MS', 1200);
    return base * intento;
  }

  private esEstadoReintentable(estado: number) {
    return [408, 429, 500, 502, 503, 504].includes(estado);
  }

  private esMensajeReintentable(mensaje: string) {
    const normalizado = mensaje.toLowerCase();
    return [
      'abort',
      'timeout',
      'econnreset',
      'fetch failed',
      'temporarily unavailable',
      'overloaded',
      '503',
      '429',
    ].some((texto) => normalizado.includes(texto));
  }

  private obtenerMensajeError(error: unknown) {
    if (error instanceof Error) {
      return error.name === 'AbortError'
        ? 'La solicitud a Gemini superó el tiempo de espera.'
        : error.message;
    }

    return 'Error desconocido';
  }

  private nombreUsuario(
    usuario?: {
      nombres?: string | null;
      apellidos?: string | null;
      correo?: string | null;
    } | null,
  ) {
    const nombre = [usuario?.nombres, usuario?.apellidos]
      .filter(Boolean)
      .join(' ')
      .trim();

    return nombre || usuario?.correo || 'Usuario del sistema';
  }

  private slug(valor: string) {
    const slug = valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70);

    return slug || 'material-ia';
  }
}
