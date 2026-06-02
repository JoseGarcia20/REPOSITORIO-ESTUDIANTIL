import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import { jsonrepair } from 'jsonrepair';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import {
  PERMISOS,
  tieneAccesoTotal,
  tienePermiso,
} from '../../auth/utils/roles.util';
import { AuditoriaService } from '../../auditoria/servicios/auditoria.service';
import { CrearAsignacionAdaptativaDto } from '../dto/crear-asignacion-adaptativa.dto';
import { CrearTipoAprendizajeAdaptativoDto } from '../dto/crear-tipo-aprendizaje-adaptativo.dto';
import { ResponderEntrevistaAdaptativaDto } from '../dto/responder-entrevista-adaptativa.dto';
import { ActualizarPasoAdaptativoDto } from '../dto/actualizar-paso-adaptativo.dto';
import { EnviarEvaluacionAdaptativaDto } from '../dto/enviar-evaluacion-adaptativa.dto';
import { GuardarEvaluacionAdaptativaDto } from '../dto/guardar-evaluacion-adaptativa.dto';
import { RevisarAsignacionAdaptativaDto } from '../dto/revisar-asignacion-adaptativa.dto';
import { CorreoAprendizajeAdaptativoService } from './correo-aprendizaje-adaptativo.service';

type RecursoRuta = {
  tipo: 'web' | 'youtube' | 'actividad' | 'lectura' | 'mapa';
  titulo: string;
  url?: string;
  embedUrl?: string;
  descripcion?: string;
  contenido?: string;
};

type PasoRuta = {
  id: string;
  orden: number;
  titulo: string;
  objetivo: string;
  estrategia: string;
  tipoActividad: string;
  descripcion: string;
  actividad: string;
  evidenciaEsperada: string;
  recursos: RecursoRuta[];
  completado: boolean;
};

const ESTADOS_ASIGNACION = [
  'asignada',
  'entrevista',
  'ruta_generada',
  'en_curso',
  'evaluacion',
  'evaluada',
  'revisada',
  'completada',
  'reasignada',
];

const TIPOS_BASE = [
  'Visual',
  'Auditivo',
  'Lector-escritor',
  'Práctico',
  'Explorador',
  'Guiado',
  'Competitivo',
  'Colaborativo',
  'Reflexivo',
];

const ESTRATEGIAS_BASE: Record<string, string[]> = {
  Visual: ['Mapas mentales', 'Diagramas', 'Infografías', 'Videos interactivos'],
  Auditivo: ['Videos explicativos', 'Podcast académico', 'Debate guiado'],
  'Lector-escritor': ['Lecturas guiadas', 'Resúmenes', 'Guías escritas'],
  Práctico: ['Talleres', 'Simulaciones', 'Laboratorios prácticos'],
  Explorador: ['Investigación guiada', 'Búsqueda web curada', 'Casos de estudio'],
  Guiado: ['Explicación paso a paso', 'Checklist de avance', 'Ejemplos resueltos'],
  Competitivo: ['Retos por puntos', 'Quices cortos', 'Simulacros'],
  Colaborativo: ['Discusión en foro', 'Co-evaluación', 'Proyecto grupal'],
  Reflexivo: ['Diario de aprendizaje', 'Análisis de errores', 'Autoevaluación'],
};

@Injectable()
export class AprendizajeAdaptativoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
    private readonly correoService: CorreoAprendizajeAdaptativoService,
  ) {}

  private readonly includeAsignacion = {
    institucion: { select: { id: true, nombre: true, logo: true } },
    docente: {
      select: { id: true, nombres: true, apellidos: true, correo: true },
    },
    estudiante: {
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        correo: true,
        gradoEscolar: { select: { id: true, nombre: true, codigo: true } },
      },
    },
    gradoEscolar: { select: { id: true, nombre: true, codigo: true } },
  };

  async catalogos(usuarioAuth: any) {
    this.validarAccesoModulo(usuarioAuth);
    await this.garantizarCatalogosBase();

    const institucionId = Number(usuarioAuth?.institucionId);
    const puedeGestionar = this.puedeGestionar(usuarioAuth);

    const [tiposAprendizaje, estudiantes, docentes] = await Promise.all([
      this.prisma.tipoAprendizaje.findMany({
        where: { estado: true },
        include: {
          estrategias: {
            include: { estrategia: true },
            orderBy: { pesoSugerido: 'desc' },
          },
        },
        orderBy: { nombre: 'asc' },
      }),
      puedeGestionar
        ? this.prisma.usuario.findMany({
            where: {
              activo: true,
              institucionId,
              rol: { nombre: { contains: 'estudiante', mode: 'insensitive' } },
            },
            select: {
              id: true,
              nombres: true,
              apellidos: true,
              correo: true,
              gradoEscolar: { select: { id: true, nombre: true } },
            },
            orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
          })
        : Promise.resolve([]),
      puedeGestionar
        ? this.prisma.usuario.findMany({
            where: {
              activo: true,
              institucionId,
              rol: { nombre: { contains: 'docente', mode: 'insensitive' } },
            },
            select: {
              id: true,
              nombres: true,
              apellidos: true,
              correo: true,
            },
            orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
          })
        : Promise.resolve([]),
    ]);

    return {
      estados: ESTADOS_ASIGNACION,
      tiposAprendizaje: tiposAprendizaje.map((tipo) => ({
        id: tipo.id,
        nombre: tipo.nombre,
        descripcion: tipo.descripcion,
        estrategias: tipo.estrategias.map((item) => ({
          id: item.estrategia.id,
          nombre: item.estrategia.nombre,
          descripcion: item.estrategia.descripcion,
          pesoSugerido: item.pesoSugerido,
        })),
      })),
      estudiantes: estudiantes.map((estudiante) => ({
        ...estudiante,
        nombreCompleto: this.nombreUsuario(estudiante),
      })),
      docentes: docentes.map((docente) => ({
        ...docente,
        nombreCompleto: this.nombreUsuario(docente),
      })),
      puedeGestionar,
      esEstudiante: this.esEstudiante(usuarioAuth),
    };
  }

  async listar(usuarioAuth: any) {
    this.validarAccesoModulo(usuarioAuth);
    const where = this.filtroAsignaciones(usuarioAuth);
    const asignaciones = await this.prisma.asignacionAprendizajeAdaptativo.findMany({
      where,
      include: this.includeAsignacion,
      orderBy: { id: 'desc' },
    });

    return await this.aplicarCierresAutomaticosPorTiempo(asignaciones);
  }

  async crear(data: CrearAsignacionAdaptativaDto, usuarioAuth: any) {
    this.validarPuedeGestionar(usuarioAuth);

    const institucionId = Number(usuarioAuth?.institucionId);
    const estudiante = await this.prisma.usuario.findFirst({
      where: {
        id: Number(data.estudianteId),
        activo: true,
        ...(tieneAccesoTotal(usuarioAuth) ? {} : { institucionId }),
      },
      include: {
        rol: true,
        gradoEscolar: true,
        institucion: true,
      },
    });

    if (!estudiante || !this.normalizar(estudiante.rol.nombre).includes('estudiante')) {
      throw new BadRequestException('Debe seleccionar un estudiante válido.');
    }

    const docenteId = data.docenteId
      ? Number(data.docenteId)
      : this.esDocente(usuarioAuth)
        ? Number(usuarioAuth?.sub)
        : 0;

    if (!docenteId) {
      throw new BadRequestException('Debe seleccionar un docente responsable.');
    }

    const docente = await this.prisma.usuario.findFirst({
      where: {
        id: docenteId,
        activo: true,
        institucionId: estudiante.institucionId,
      },
      include: { rol: true },
    });

    if (!docente || !this.normalizar(docente.rol.nombre).includes('docente')) {
      throw new BadRequestException('Debe seleccionar un docente válido.');
    }

    const preguntas = this.construirPreguntasEntrevista(data.tema);

    const asignacion =
      await this.prisma.asignacionAprendizajeAdaptativo.create({
        data: {
          tema: data.tema.trim(),
          objetivo: data.objetivo?.trim(),
          nivelSolicitado: data.nivelSolicitado?.trim(),
          tiempoDisponible: data.tiempoDisponible?.trim(),
          fechaLimite: data.fechaLimite ? new Date(data.fechaLimite) : undefined,
          entrevistaPreguntas: preguntas,
          institucionId: estudiante.institucionId,
          estudianteId: estudiante.id,
          docenteId: docente.id,
          gradoEscolarId: estudiante.gradoEscolarId,
        },
        include: this.includeAsignacion,
      });

    await this.auditoriaService.registrar(
      {
        entidad: 'aprendizaje_adaptativo',
        entidadId: asignacion.id,
        accion: 'asignado',
        detalles: {
          tema: asignacion.tema,
          estudiante: this.nombreUsuario(asignacion.estudiante),
        },
        institucionId: asignacion.institucionId,
      },
      usuarioAuth,
    );

    await this.correoService.enviar({
      to: estudiante.correo,
      subject: `Nueva ruta adaptativa asignada: ${asignacion.tema}`,
      html: this.plantillaCorreo(
        'Nueva ruta de aprendizaje adaptativo',
        `${this.nombreUsuario(docente)} te asignó una ruta sobre <strong>${asignacion.tema}</strong>. Ingresa a NEXORA AI para aprobar la asignación e iniciar la entrevista.`,
      ),
    });

    return asignacion;
  }

  async crearTipoAprendizaje(
    data: CrearTipoAprendizajeAdaptativoDto,
    usuarioAuth: any,
  ) {
    this.validarAdministradorTipos(usuarioAuth);

    const nombre = data.nombre.trim();
    const existente = await this.prisma.tipoAprendizaje.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
    });
    const tipo = existente
      ? await this.prisma.tipoAprendizaje.update({
          where: { id: existente.id },
          data: {
            nombre,
            descripcion: data.descripcion?.trim() || existente.descripcion,
            estado: true,
          },
        })
      : await this.prisma.tipoAprendizaje.create({
          data: {
            nombre,
            descripcion: data.descripcion?.trim(),
            estado: true,
          },
        });

    await this.sincronizarEstrategiasTipo(tipo.id, data.estrategias || []);

    await this.auditoriaService.registrar(
      {
        entidad: 'tipo_aprendizaje',
        entidadId: tipo.id,
        accion: existente ? 'reactivado' : 'creado',
        detalles: { nombre },
      },
      usuarioAuth,
    );

    return await this.obtenerTipoAprendizaje(tipo.id);
  }

  async inactivarTipoAprendizaje(id: number, usuarioAuth: any) {
    this.validarAdministradorTipos(usuarioAuth);

    const tipo = await this.prisma.tipoAprendizaje.findUnique({ where: { id } });
    if (!tipo) {
      throw new NotFoundException('Tipo de aprendizaje no encontrado.');
    }

    const actualizado = await this.prisma.tipoAprendizaje.update({
      where: { id },
      data: { estado: false },
    });

    await this.auditoriaService.registrar(
      {
        entidad: 'tipo_aprendizaje',
        entidadId: actualizado.id,
        accion: 'inactivado',
        detalles: { nombre: actualizado.nombre },
      },
      usuarioAuth,
    );

    return await this.obtenerTipoAprendizaje(actualizado.id);
  }

  async aprobar(id: number, usuarioAuth: any) {
    const asignacion = await this.obtenerConAcceso(id, usuarioAuth);

    if (Number(asignacion.estudianteId) !== Number(usuarioAuth?.sub)) {
      throw new ForbiddenException('Solo el estudiante asignado puede aprobar.');
    }

    if (!['asignada', 'reasignada'].includes(asignacion.estado)) {
      throw new BadRequestException('La asignación ya fue aprobada.');
    }

    return await this.prisma.asignacionAprendizajeAdaptativo.update({
      where: { id },
      data: {
        estado: 'entrevista',
        fechaAprobacion: new Date(),
      },
      include: this.includeAsignacion,
    });
  }

  async responderEntrevista(
    id: number,
    data: ResponderEntrevistaAdaptativaDto,
    usuarioAuth: any,
  ) {
    const asignacion = await this.obtenerConAcceso(id, usuarioAuth);

    if (Number(asignacion.estudianteId) !== Number(usuarioAuth?.sub)) {
      throw new ForbiddenException('Solo el estudiante asignado puede responder.');
    }

    if (!['asignada', 'entrevista', 'reasignada'].includes(asignacion.estado)) {
      throw new BadRequestException('La entrevista ya fue registrada.');
    }

    const catalogo = await this.obtenerCatalogoPerfil();
    const recursos = await this.buscarRecursosExternos(asignacion.tema);
    const resultado = await this.generarRutaConIa(
      asignacion,
      data.respuestas,
      catalogo,
      recursos,
    );

    return await this.prisma.asignacionAprendizajeAdaptativo.update({
      where: { id },
      data: {
        estado: 'ruta_generada',
        entrevistaRespuestas: this.json(data.respuestas),
        perfilAprendizaje: resultado.perfilAprendizaje,
        diagnostico: resultado.diagnostico,
        ruta: resultado.ruta,
        evaluacion: resultado.evaluacion,
        respuestasEvaluacion: Prisma.DbNull,
        resultadoEvaluacion: Prisma.DbNull,
        revisionDocente: Prisma.DbNull,
        fechaAprobacion: asignacion.fechaAprobacion || new Date(),
        fechaRutaGenerada: new Date(),
      },
      include: this.includeAsignacion,
    });
  }

  async iniciarRuta(id: number, usuarioAuth: any) {
    const asignacion = await this.obtenerConAcceso(id, usuarioAuth);

    if (Number(asignacion.estudianteId) !== Number(usuarioAuth?.sub)) {
      throw new ForbiddenException('Solo el estudiante asignado puede iniciar.');
    }

    if (!['ruta_generada', 'en_curso'].includes(asignacion.estado)) {
      throw new BadRequestException('La ruta no está lista para iniciar.');
    }

    return await this.prisma.asignacionAprendizajeAdaptativo.update({
      where: { id },
      data: { estado: 'en_curso' },
      include: this.includeAsignacion,
    });
  }

  async regenerarRuta(id: number, usuarioAuth: any) {
    const asignacion = await this.obtenerConAcceso(id, usuarioAuth);
    const respuestas = Array.isArray(asignacion.entrevistaRespuestas)
      ? asignacion.entrevistaRespuestas
      : [];

    if (respuestas.length === 0) {
      throw new BadRequestException(
        'La entrevista debe estar registrada para regenerar la ruta.',
      );
    }

    const catalogo = await this.obtenerCatalogoPerfil();
    const recursos = await this.buscarRecursosExternos(asignacion.tema);
    const resultado = await this.generarRutaConIa(
      asignacion,
      respuestas,
      catalogo,
      recursos,
    );

    return await this.prisma.asignacionAprendizajeAdaptativo.update({
      where: { id },
      data: {
        estado: 'ruta_generada',
        perfilAprendizaje: resultado.perfilAprendizaje,
        diagnostico: resultado.diagnostico,
        ruta: resultado.ruta,
        evaluacion: resultado.evaluacion,
        respuestasEvaluacion: Prisma.DbNull,
        resultadoEvaluacion: Prisma.DbNull,
        revisionDocente: Prisma.DbNull,
        fechaRutaGenerada: new Date(),
      },
      include: this.includeAsignacion,
    });
  }

  async actualizarPaso(
    id: number,
    indice: number,
    data: ActualizarPasoAdaptativoDto,
    usuarioAuth: any,
  ) {
    const asignacion = await this.obtenerConAcceso(id, usuarioAuth);

    if (Number(asignacion.estudianteId) !== Number(usuarioAuth?.sub)) {
      throw new ForbiddenException('Solo el estudiante asignado puede avanzar.');
    }

    const ruta = this.obtenerRuta(asignacion);
    const pasos = ruta.pasos || [];

    if (!pasos[indice]) {
      throw new BadRequestException('El paso indicado no existe.');
    }

    pasos[indice] = { ...pasos[indice], completado: data.completado };
    const todosCompletos = pasos.every((paso) => paso.completado);

    return await this.prisma.asignacionAprendizajeAdaptativo.update({
      where: { id },
      data: {
        ruta: { ...ruta, pasos },
        estado: todosCompletos ? 'evaluacion' : 'en_curso',
      },
      include: this.includeAsignacion,
    });
  }

  async enviarEvaluacion(
    id: number,
    data: EnviarEvaluacionAdaptativaDto,
    usuarioAuth: any,
  ) {
    const asignacion = await this.obtenerConAcceso(id, usuarioAuth);
    this.validarAccesoEvaluacion(asignacion, usuarioAuth);
    const evaluacion = this.obtenerEstadoEvaluacion(asignacion);

    if (this.evaluacionExpirada(evaluacion)) {
      return await this.finalizarEvaluacion(asignacion, {
        motivo: 'tiempo',
        respuestas: Array.isArray(asignacion.respuestasEvaluacion)
          ? asignacion.respuestasEvaluacion
          : data.respuestas,
      });
    }

    if (!evaluacion.iniciadaEn) {
      throw new BadRequestException(
        'Debes iniciar la evaluación antes de enviarla.',
      );
    }

    return await this.finalizarEvaluacion(asignacion, {
      motivo: 'entrega',
      respuestas: data.respuestas,
    });
  }

  async iniciarEvaluacion(id: number, usuarioAuth: any) {
    const asignacion = await this.obtenerConAcceso(id, usuarioAuth);
    this.validarAccesoEvaluacion(asignacion, usuarioAuth);

    if (!['evaluacion', 'en_curso', 'ruta_generada'].includes(asignacion.estado)) {
      throw new BadRequestException('La evaluación no está disponible todavía.');
    }

    if (asignacion.estado !== 'evaluacion') {
      throw new BadRequestException(
        'Completa todos los pasos de la ruta para desbloquear la evaluación.',
      );
    }

    const evaluacion = this.obtenerEstadoEvaluacion(asignacion);
    if (evaluacion.cerradaEn) {
      throw new BadRequestException('La evaluación ya está cerrada.');
    }

    if (this.evaluacionExpirada(evaluacion)) {
      return await this.finalizarEvaluacion(asignacion, {
        motivo: 'tiempo',
        respuestas: Array.isArray(asignacion.respuestasEvaluacion)
          ? asignacion.respuestasEvaluacion
          : [],
      });
    }

    if (evaluacion.iniciadaEn) {
      return asignacion;
    }

    const ahora = new Date();
    const limite = new Date(ahora.getTime() + 30 * 60 * 1000);
    const evaluacionActualizada = {
      ...evaluacion,
      iniciadaEn: ahora.toISOString(),
      limiteEn: limite.toISOString(),
      cerradaEn: null,
      cierreMotivo: null,
      estado: 'en_progreso',
      tiempoMaximoMinutos: 30,
    };

    return await this.prisma.asignacionAprendizajeAdaptativo.update({
      where: { id },
      data: {
        estado: 'evaluacion',
        evaluacion: evaluacionActualizada,
      },
      include: this.includeAsignacion,
    });
  }

  async guardarParcialEvaluacion(
    id: number,
    data: GuardarEvaluacionAdaptativaDto,
    usuarioAuth: any,
  ) {
    const asignacion = await this.obtenerConAcceso(id, usuarioAuth);
    this.validarAccesoEvaluacion(asignacion, usuarioAuth);
    const evaluacion = this.obtenerEstadoEvaluacion(asignacion);

    if (asignacion.estado === 'evaluada' || evaluacion.cerradaEn) {
      return asignacion;
    }

    if (!evaluacion.iniciadaEn) {
      throw new BadRequestException(
        'Debes iniciar la evaluación antes de guardar respuestas.',
      );
    }

    if (this.evaluacionExpirada(evaluacion)) {
      return await this.finalizarEvaluacion(asignacion, {
        motivo: 'tiempo',
        respuestas:
          data.respuestas ||
          (Array.isArray(asignacion.respuestasEvaluacion)
            ? asignacion.respuestasEvaluacion
            : []),
      });
    }

    return await this.prisma.asignacionAprendizajeAdaptativo.update({
      where: { id },
      data: {
        estado: 'evaluacion',
        respuestasEvaluacion: this.json(
          data.respuestas ||
            (Array.isArray(asignacion.respuestasEvaluacion)
              ? asignacion.respuestasEvaluacion
              : []),
        ),
        evaluacion: {
          ...evaluacion,
          estado: 'en_progreso',
        },
      },
      include: this.includeAsignacion,
    });
  }

  async cerrarEvaluacion(
    id: number,
    data: GuardarEvaluacionAdaptativaDto,
    usuarioAuth: any,
  ) {
    const asignacion = await this.obtenerConAcceso(id, usuarioAuth);
    this.validarAccesoEvaluacion(asignacion, usuarioAuth);
    const evaluacion = this.obtenerEstadoEvaluacion(asignacion);

    if (asignacion.estado === 'evaluada' || evaluacion.cerradaEn) {
      return asignacion;
    }

    return await this.finalizarEvaluacion(asignacion, {
      motivo: data.motivo || 'abandono',
      respuestas:
        data.respuestas ||
        (Array.isArray(asignacion.respuestasEvaluacion)
          ? asignacion.respuestasEvaluacion
          : []),
    });
  }

  async revisar(
    id: number,
    data: RevisarAsignacionAdaptativaDto,
    usuarioAuth: any,
  ) {
    const asignacion = await this.obtenerConAcceso(id, usuarioAuth);

    if (!this.puedeGestionar(usuarioAuth)) {
      throw new ForbiddenException('No puede revisar esta ruta.');
    }

    if (
      !tieneAccesoTotal(usuarioAuth) &&
      !this.esAdministrador(usuarioAuth) &&
      !this.esAdministrativo(usuarioAuth) &&
      Number(asignacion.docenteId) !== Number(usuarioAuth?.sub)
    ) {
      throw new ForbiddenException('Solo el docente asignado puede revisar.');
    }

    if (!['evaluada', 'revisada'].includes(asignacion.estado)) {
      throw new BadRequestException('La ruta aún no está lista para revisión.');
    }

    const revision = {
      decision: data.decision,
      observaciones: data.observaciones || '',
      revisadoPor: Number(usuarioAuth?.sub),
      revisadoEn: new Date().toISOString(),
    };
    const conclusionesPdf =
      data.decision === 'completada'
        ? await this.generarPdfConclusiones(asignacion, revision)
        : null;

    const actualizado = await this.prisma.asignacionAprendizajeAdaptativo.update({
      where: { id },
      data: {
        estado: data.decision,
        revisionDocente: revision,
        conclusionesPdf: conclusionesPdf?.rutaPublica || asignacion.conclusionesPdf,
        fechaRevision: new Date(),
      },
      include: this.includeAsignacion,
    });

    await this.correoService.enviar({
      to: actualizado.estudiante.correo,
      subject:
        data.decision === 'completada'
          ? `Ruta adaptativa completada: ${actualizado.tema}`
          : `Ruta adaptativa reasignada: ${actualizado.tema}`,
      html: this.plantillaCorreo(
        data.decision === 'completada'
          ? 'Ruta de aprendizaje completada'
          : 'Ruta de aprendizaje requiere refuerzo',
        data.decision === 'completada'
          ? `Tu docente revisó la ruta <strong>${actualizado.tema}</strong> y la marcó como completada.`
          : `Tu docente revisó la ruta <strong>${actualizado.tema}</strong> y solicitó una nueva explicación o refuerzo.`,
      ),
      attachments:
        conclusionesPdf && data.decision === 'completada'
          ? [
              {
                filename: `conclusiones-${actualizado.id}.pdf`,
                path: conclusionesPdf.rutaAbsoluta,
              },
            ]
          : undefined,
    });

    return actualizado;
  }

  private async aplicarCierresAutomaticosPorTiempo(asignaciones: any[]) {
    const resultados: any[] = [];

    for (const asignacion of asignaciones) {
      const evaluacion = this.obtenerEstadoEvaluacion(asignacion);
      if (
        asignacion.estado === 'evaluacion' &&
        this.evaluacionExpirada(evaluacion)
      ) {
        resultados.push(
          await this.finalizarEvaluacion(asignacion, {
            motivo: 'tiempo',
            respuestas: Array.isArray(asignacion.respuestasEvaluacion)
              ? asignacion.respuestasEvaluacion
              : [],
          }),
        );
        continue;
      }

      resultados.push(asignacion);
    }

    return resultados;
  }

  private validarAccesoEvaluacion(asignacion: any, usuarioAuth: any) {
    if (Number(asignacion.estudianteId) !== Number(usuarioAuth?.sub)) {
      throw new ForbiddenException('Solo el estudiante asignado puede evaluar.');
    }
  }

  private obtenerEstadoEvaluacion(asignacion: any) {
    const original = asignacion.evaluacion;
    const base =
      original && typeof original === 'object' && !Array.isArray(original)
        ? original
        : {};
    const preguntas = Array.isArray(base.preguntas)
      ? base.preguntas
      : Array.isArray(original)
        ? original
        : [];

    return {
      ...base,
      instrucciones:
        base.instrucciones ||
        'Responde con tus palabras y justifica cada respuesta.',
      preguntas,
      tiempoMaximoMinutos: this.aNumero(base.tiempoMaximoMinutos, 30) || 30,
      iniciadaEn: base.iniciadaEn || null,
      limiteEn: base.limiteEn || null,
      cerradaEn: base.cerradaEn || null,
      cierreMotivo: base.cierreMotivo || null,
      estado:
        base.estado || (base.cerradaEn ? 'cerrada' : base.iniciadaEn ? 'en_progreso' : 'pendiente'),
    };
  }

  private evaluacionExpirada(evaluacion: any) {
    if (!evaluacion.iniciadaEn || !evaluacion.limiteEn || evaluacion.cerradaEn) {
      return false;
    }

    return new Date(evaluacion.limiteEn).getTime() <= Date.now();
  }

  private async finalizarEvaluacion(
    asignacion: any,
    data: { motivo: string; respuestas: any[] },
  ) {
    const respuestas = Array.isArray(data.respuestas) ? data.respuestas : [];
    const resultado = await this.calificarEvaluacionConIa(asignacion, respuestas);
    const evaluacion = this.obtenerEstadoEvaluacion(asignacion);
    const evaluacionCerrada = {
      ...evaluacion,
      estado: 'cerrada',
      cerradaEn: new Date().toISOString(),
      cierreMotivo: data.motivo,
    };

    const actualizado: any =
      await this.prisma.asignacionAprendizajeAdaptativo.update({
        where: { id: asignacion.id },
        data: {
          estado: 'evaluada',
          respuestasEvaluacion: this.json(respuestas),
          resultadoEvaluacion: resultado,
          evaluacion: evaluacionCerrada,
          fechaFinalizacion: new Date(),
        },
        include: this.includeAsignacion,
      });

    await this.correoService.enviar({
      to: actualizado.docente.correo,
      subject: `Ruta adaptativa finalizada: ${actualizado.tema}`,
      html: this.plantillaCorreo(
        'Ruta finalizada por el estudiante',
        `${this.nombreUsuario(actualizado.estudiante)} terminó la ruta <strong>${actualizado.tema}</strong>. Ingresa a NEXORA AI para revisar el resultado y cerrar el proceso.`,
      ),
    });

    return actualizado;
  }

  private validarAccesoModulo(usuarioAuth: any) {
    if (
      !tienePermiso(usuarioAuth, PERMISOS.FOROS_VER) &&
      !tienePermiso(usuarioAuth, PERMISOS.RECURSOS_VER) &&
      !tienePermiso(usuarioAuth, PERMISOS.PREPARADOR_IA_USAR)
    ) {
      throw new ForbiddenException('No tiene permisos para acceder al módulo.');
    }
  }

  private validarPuedeGestionar(usuarioAuth: any) {
    this.validarAccesoModulo(usuarioAuth);
    if (!this.puedeGestionar(usuarioAuth)) {
      throw new ForbiddenException('Solo docentes o administrativos pueden asignar.');
    }
  }

  private validarAdministradorTipos(usuarioAuth: any) {
    if (!tieneAccesoTotal(usuarioAuth) && !this.esAdministrador(usuarioAuth)) {
      throw new ForbiddenException(
        'Solo administradores pueden modificar tipos de aprendizaje.',
      );
    }
  }

  private puedeGestionar(usuarioAuth: any) {
    if (tieneAccesoTotal(usuarioAuth)) {
      return true;
    }

    const rol = this.normalizar(usuarioAuth?.rol || '');
    return (
      rol.includes('docente') ||
      rol.includes('administrador') ||
      (rol.includes('administrativo') && !rol.includes('estudiante'))
    );
  }

  private esAdministrador(usuarioAuth: any) {
    const rol = this.normalizar(usuarioAuth?.rol || '');
    return tieneAccesoTotal(usuarioAuth) || rol.includes('administrador');
  }

  private esDocente(usuarioAuth: any) {
    return this.normalizar(usuarioAuth?.rol || '').includes('docente');
  }

  private esAdministrativo(usuarioAuth: any) {
    const rol = this.normalizar(usuarioAuth?.rol || '');
    return rol.includes('administrativo') && !rol.includes('estudiante');
  }

  private esEstudiante(usuarioAuth: any) {
    return this.normalizar(usuarioAuth?.rol || '').includes('estudiante');
  }

  private filtroAsignaciones(usuarioAuth: any) {
    if (tieneAccesoTotal(usuarioAuth)) {
      return {};
    }

    const institucionId = Number(usuarioAuth?.institucionId);
    const usuarioId = Number(usuarioAuth?.sub);

    if (this.esEstudiante(usuarioAuth)) {
      return { institucionId, estudianteId: usuarioId };
    }

    if (this.esAdministrador(usuarioAuth) || this.esAdministrativo(usuarioAuth)) {
      return { institucionId };
    }

    return { institucionId, docenteId: usuarioId };
  }

  private async obtenerConAcceso(id: number, usuarioAuth: any): Promise<any> {
    this.validarAccesoModulo(usuarioAuth);

    let asignacion: any =
      await this.prisma.asignacionAprendizajeAdaptativo.findUnique({
        where: { id },
        include: this.includeAsignacion,
      });

    if (!asignacion) {
      throw new NotFoundException('Asignación adaptativa no encontrada.');
    }

    if (tieneAccesoTotal(usuarioAuth)) {
      return asignacion;
    }

    if (Number(asignacion.institucionId) !== Number(usuarioAuth?.institucionId)) {
      throw new ForbiddenException('No puede acceder a otra institución.');
    }

    const usuarioId = Number(usuarioAuth?.sub);
    if (
      this.esEstudiante(usuarioAuth) &&
      Number(asignacion.estudianteId) !== usuarioId
    ) {
      throw new ForbiddenException('No puede acceder a esta asignación.');
    }

    if (
      !this.esEstudiante(usuarioAuth) &&
      !this.esAdministrador(usuarioAuth) &&
      !this.esAdministrativo(usuarioAuth) &&
      Number(asignacion.docenteId) !== usuarioId
    ) {
      throw new ForbiddenException('No puede acceder a esta asignación.');
    }

    const evaluacion = this.obtenerEstadoEvaluacion(asignacion);
    if (asignacion.estado === 'evaluacion' && this.evaluacionExpirada(evaluacion)) {
      asignacion = await this.finalizarEvaluacion(asignacion, {
        motivo: 'tiempo',
        respuestas: Array.isArray(asignacion.respuestasEvaluacion)
          ? asignacion.respuestasEvaluacion
          : [],
      });
    }

    return asignacion;
  }

  private construirPreguntasEntrevista(tema: string) {
    return [
      {
        id: 'experiencia',
        pregunta: `Cuéntame una experiencia previa que hayas tenido con ${tema}. ¿Qué se te hizo fácil y qué se te hizo difícil?`,
      },
      {
        id: 'nivel',
        pregunta:
          '¿Qué tan seguro te sientes actualmente con este tema y qué conceptos crees que ya manejas?',
      },
      {
        id: 'tiempo',
        pregunta:
          '¿Cuánto tiempo puedes dedicarle durante los próximos días y en qué momentos estudias mejor?',
      },
      {
        id: 'meta',
        pregunta:
          '¿Qué te gustaría lograr exactamente al terminar esta ruta de aprendizaje?',
      },
      {
        id: 'preferencia',
        pregunta:
          'Cuando aprendes algo nuevo, ¿prefieres ver ejemplos visuales, escuchar explicaciones, leer, practicar, investigar, trabajar con alguien o resolver retos?',
      },
    ];
  }

  private async obtenerCatalogoPerfil() {
    await this.garantizarCatalogosBase();
    const tipos = await this.prisma.tipoAprendizaje.findMany({
      where: { estado: true },
      include: {
        estrategias: { include: { estrategia: true } },
      },
      orderBy: { nombre: 'asc' },
    });

    return tipos.map((tipo) => ({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      estrategias: tipo.estrategias.map((item) => item.estrategia.nombre),
    }));
  }

  private async obtenerTipoAprendizaje(id: number) {
    const tipo = await this.prisma.tipoAprendizaje.findUnique({
      where: { id },
      include: {
        estrategias: {
          include: { estrategia: true },
          orderBy: { pesoSugerido: 'desc' },
        },
      },
    });

    if (!tipo) {
      throw new NotFoundException('Tipo de aprendizaje no encontrado.');
    }

    return {
      id: tipo.id,
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      estrategias: tipo.estrategias.map((item) => ({
        id: item.estrategia.id,
        nombre: item.estrategia.nombre,
        descripcion: item.estrategia.descripcion,
        pesoSugerido: item.pesoSugerido,
      })),
    };
  }

  private async sincronizarEstrategiasTipo(
    tipoAprendizajeId: number,
    estrategias: string[],
  ) {
    const nombres = estrategias
      .map((estrategia) => estrategia.trim())
      .filter(Boolean)
      .slice(0, 12);

    if (nombres.length === 0) {
      return;
    }

    for (const nombre of nombres) {
      const estrategia = await this.prisma.estrategiaAprendizaje.upsert({
        where: { nombre },
        update: { estado: true },
        create: {
          nombre,
          descripcion: `Estrategia sugerida para aprendizaje adaptativo.`,
          estado: true,
        },
      });

      await this.prisma.tipoAprendizajeEstrategia.upsert({
        where: {
          tipoAprendizajeId_estrategiaId: {
            tipoAprendizajeId,
            estrategiaId: estrategia.id,
          },
        },
        update: { pesoSugerido: 70 },
        create: {
          tipoAprendizajeId,
          estrategiaId: estrategia.id,
          pesoSugerido: 70,
        },
      });
    }
  }

  private async garantizarCatalogosBase() {
    for (const nombre of TIPOS_BASE) {
      const tipoExistente = await this.prisma.tipoAprendizaje.findFirst({
        where: { nombre: { equals: nombre, mode: 'insensitive' } },
      });
      const tipo = tipoExistente
        ? await this.prisma.tipoAprendizaje.update({
            where: { id: tipoExistente.id },
            data: { estado: true },
          })
        : await this.prisma.tipoAprendizaje.create({
            data: {
          nombre,
          descripcion: `Perfil de aprendizaje ${nombre.toLowerCase()}.`,
          estado: true,
            },
          });

      for (const estrategiaNombre of ESTRATEGIAS_BASE[nombre] || []) {
        const estrategia = await this.prisma.estrategiaAprendizaje.upsert({
          where: { nombre: estrategiaNombre },
          update: { estado: true },
          create: {
            nombre: estrategiaNombre,
            descripcion: `Estrategia sugerida para aprendizaje ${nombre.toLowerCase()}.`,
            estado: true,
          },
        });

        await this.prisma.tipoAprendizajeEstrategia.upsert({
          where: {
            tipoAprendizajeId_estrategiaId: {
              tipoAprendizajeId: tipo.id,
              estrategiaId: estrategia.id,
            },
          },
          update: { pesoSugerido: 70 },
          create: {
            tipoAprendizajeId: tipo.id,
            estrategiaId: estrategia.id,
            pesoSugerido: 70,
          },
        });
      }
    }
  }

  private async buscarRecursosExternos(tema: string) {
    const [web, videos] = await Promise.all([
      this.buscarWeb(tema),
      this.buscarVideosYoutube(tema),
    ]);

    return { web, videos };
  }

  private async buscarWeb(tema: string) {
    const key = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!key || !cx) {
      return await this.buscarWebScraping(tema);
    }

    try {
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.set('key', key);
      url.searchParams.set('cx', cx);
      url.searchParams.set('q', `${tema} explicación ejercicios educación`);
      url.searchParams.set('num', '5');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Search respondió ${response.status}`);
      }
      const data = await response.json();
      return (data.items || []).slice(0, 5).map((item: any) => ({
        titulo: item.title,
        url: item.link,
        descripcion: item.snippet,
      }));
    } catch {
      return await this.buscarWebScraping(tema);
    }
  }

  private async buscarVideosYoutube(tema: string) {
    const key = process.env.YOUTUBE_API_KEY;

    if (!key) {
      return await this.buscarVideosYoutubeScraping(
        `${tema} explicacion educacion`,
      );
    }

    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('type', 'video');
      url.searchParams.set('maxResults', '4');
      url.searchParams.set('q', `${tema} explicación educación`);
      url.searchParams.set('key', key);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`YouTube respondió ${response.status}`);
      }
      const data = await response.json();
      return (data.items || []).slice(0, 4).map((item: any) => ({
        titulo: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
        descripcion: item.snippet.description,
      }));
    } catch {
      return await this.buscarVideosYoutubeScraping(
        `${tema} explicacion educacion`,
      );
    }
  }

  private async buscarWebScraping(tema: string) {
    try {
      const url = new URL('https://html.duckduckgo.com/html/');
      url.searchParams.set('q', `${tema} educacion explicacion`);
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        },
      });
      if (!response.ok) {
        throw new Error(`DuckDuckGo respondio ${response.status}`);
      }

      const html = await response.text();
      const enlaces = [
        ...html.matchAll(
          /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
        ),
      ]
        .map((match) => {
          const href = this.decodificarUrlDuckDuckGo(match[1]);
          const titulo = this.limpiarHtml(match[2]);
          return {
            titulo,
            url: href,
            descripcion: 'Referencia web sugerida para profundizar el tema.',
          };
        })
        .filter((item) => item.url && /^https?:\/\//i.test(item.url))
        .slice(0, 5);

      if (enlaces.length > 0) {
        return enlaces;
      }
    } catch {
      // Continúa al fallback local.
    }

    return [
      {
        titulo: `Lectura guiada sobre ${tema}`,
        url: `https://es.wikipedia.org/wiki/${encodeURIComponent(tema.replace(/\s+/g, '_'))}`,
        descripcion: 'Referencia general de apoyo para el tema.',
      },
    ];
  }

  private async buscarVideosYoutubeScraping(consulta: string) {
    try {
      const url = new URL('https://www.youtube.com/results');
      url.searchParams.set('search_query', consulta);
      url.searchParams.set('sp', 'EgIQAQ%253D%253D');
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
      });
      if (!response.ok) {
        throw new Error(`YouTube respondio ${response.status}`);
      }

      const html = await response.text();
      const ids = Array.from(
        new Set(
          [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(
            (match) => match[1],
          ),
        ),
      ).slice(0, 4);

      if (ids.length === 0) {
        throw new Error('No se encontraron videos en el HTML de YouTube.');
      }

      const videos = await Promise.all(
        ids.map(async (videoId) => {
          const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
          const embedUrl = `https://www.youtube.com/embed/${videoId}`;
          try {
            const oembedUrl = new URL('https://www.youtube.com/oembed');
            oembedUrl.searchParams.set('url', watchUrl);
            oembedUrl.searchParams.set('format', 'json');
            const oembedResponse = await fetch(oembedUrl);
            if (!oembedResponse.ok) {
              throw new Error('oEmbed no disponible');
            }
            const oembed = await oembedResponse.json();
            return {
              titulo: String(oembed.title || `Video sugerido ${videoId}`),
              url: watchUrl,
              embedUrl,
              descripcion: String(
                oembed.author_name
                  ? `Canal: ${oembed.author_name}`
                  : 'Video recomendado para esta parte de la ruta.',
              ),
            };
          } catch {
            return {
              titulo: `Video sugerido ${videoId}`,
              url: watchUrl,
              embedUrl,
              descripcion: 'Video recomendado para esta parte de la ruta.',
            };
          }
        }),
      );

      return videos;
    } catch {
      return [];
    }
  }

  private async generarRutaConIa(
    asignacion: any,
    respuestas: any[],
    catalogo: any[],
    recursos: { web: any[]; videos: any[] },
  ) {
    const rutaLocal = this.generarRutaLocal(asignacion, respuestas, catalogo, recursos);
    const prompt = [
      'Eres un diseñador instruccional de NEXORA AI.',
      'Devuelve SOLO JSON válido con las llaves: perfilAprendizaje, diagnostico, ruta, evaluacion.',
      'perfilAprendizaje debe incluir principal, secundarios y porcentajes. porcentajes debe ser un arreglo de objetos {tipo, porcentaje, justificacion}.',
      'diagnostico debe incluir nivelDificultad, duracionEstimada y justificacion.',
      'ruta debe ser un plan de clases o estudio completo con entre 5 y 8 pasos progresivos.',
      'Cada paso debe ser una clase, actividad o bloque de estudio accionable y debe incluir id, orden, titulo, objetivo, estrategia, tipoActividad, descripcion, actividad, evidenciaEsperada, recursos y completado=false.',
      'La ruta no debe quedarse en recomendaciones generales: cada paso debe explicar qué estudiar, cómo hacerlo, qué material usar y qué evidencia produce el estudiante.',
      'evaluacion debe tener entre 4 y 6 preguntas abiertas con id, pregunta, criterio y puntajeMaximo.',
      `Tema: ${asignacion.tema}`,
      `Objetivo docente: ${asignacion.objetivo || 'No especificado'}`,
      `Nivel solicitado: ${asignacion.nivelSolicitado || 'No especificado'}`,
      `Tiempo disponible: ${asignacion.tiempoDisponible || 'No especificado'}`,
      `Grado: ${asignacion.gradoEscolar?.nombre || 'No especificado'}`,
      `Tipos y estrategias disponibles: ${JSON.stringify(catalogo)}`,
      `Respuestas entrevista: ${JSON.stringify(respuestas)}`,
      `Recursos web encontrados: ${JSON.stringify(recursos.web)}`,
      `Videos encontrados: ${JSON.stringify(recursos.videos)}`,
    ].join('\n');

    const generado = await this.llamarGeminiJson<any>(prompt, () => null);
    return this.normalizarResultadoRuta(
      generado,
      rutaLocal,
      recursos,
      String(asignacion.tema || 'Tema'),
    );
  }

  private normalizarResultadoRuta(
    generado: any,
    rutaLocal: any,
    recursos: { web: any[]; videos: any[] },
    tema: string,
  ) {
    if (!generado || typeof generado !== 'object') {
      return rutaLocal;
    }

    const perfilAprendizaje = this.normalizarPerfilAprendizaje(
      generado.perfilAprendizaje,
      rutaLocal.perfilAprendizaje,
    );
    const pasosGenerados = Array.isArray(generado.ruta?.pasos)
      ? generado.ruta.pasos
      : Array.isArray(generado.ruta)
        ? generado.ruta
        : Array.isArray(generado.pasos)
          ? generado.pasos
          : [];
    const pasos =
      pasosGenerados.length >= 5
        ? pasosGenerados.slice(0, 8).map((paso: any, index: number) =>
            this.normalizarPasoRuta(paso, index, recursos, tema),
          )
        : rutaLocal.ruta.pasos;
    const preguntasGeneradas = Array.isArray(generado.evaluacion?.preguntas)
      ? generado.evaluacion.preguntas
      : Array.isArray(generado.evaluacion)
        ? generado.evaluacion
        : [];
    const preguntas =
      preguntasGeneradas.length >= 4
        ? preguntasGeneradas.slice(0, 6).map((pregunta: any, index: number) => ({
            id: String(pregunta.id || `eval-${index + 1}`),
            pregunta: String(pregunta.pregunta || pregunta.texto || pregunta.enunciado || ''),
            criterio: String(pregunta.criterio || 'Comprensión y aplicación'),
            puntajeMaximo: this.aNumero(
              pregunta.puntajeMaximo || pregunta.puntaje,
              20,
            ),
          }))
        : rutaLocal.evaluacion.preguntas;

    return {
      perfilAprendizaje,
      diagnostico: {
        nivelDificultad:
          generado.diagnostico?.nivelDificultad ||
          rutaLocal.diagnostico.nivelDificultad,
        duracionEstimada:
          generado.diagnostico?.duracionEstimada ||
          rutaLocal.diagnostico.duracionEstimada,
        justificacion:
          generado.diagnostico?.justificacion ||
          rutaLocal.diagnostico.justificacion,
      },
      ruta: {
        titulo: generado.ruta?.titulo || rutaLocal.ruta.titulo,
        nivelDificultad:
          generado.ruta?.nivelDificultad || rutaLocal.ruta.nivelDificultad,
        duracionEstimada:
          generado.ruta?.duracionEstimada || rutaLocal.ruta.duracionEstimada,
        enfoquePedagogico:
          generado.ruta?.enfoquePedagogico ||
          `Ruta adaptada al perfil ${perfilAprendizaje.principal}.`,
        pasos,
        recomendacionesDocente:
          generado.ruta?.recomendacionesDocente ||
          rutaLocal.ruta.recomendacionesDocente,
      },
      evaluacion: {
        instrucciones:
          generado.evaluacion?.instrucciones ||
          rutaLocal.evaluacion.instrucciones,
        preguntas,
        tiempoMaximoMinutos: 30,
        iniciadaEn: null,
        limiteEn: null,
        cerradaEn: null,
        cierreMotivo: null,
        estado: 'pendiente',
      },
    };
  }

  private normalizarPerfilAprendizaje(generado: any, fallback: any) {
    const porcentajesBase = Array.isArray(generado?.porcentajes)
      ? generado.porcentajes
      : generado && typeof generado === 'object'
        ? Object.entries(generado)
            .filter(([, valor]) => this.aNumero(valor, 0) > 0)
            .map(([tipo, porcentaje]) => ({
              tipo,
              porcentaje,
              justificacion: `Afinidad detectada para ${tipo}.`,
            }))
        : [];
    const porcentajes = porcentajesBase
      .map((item: any) => ({
        tipo: String(item.tipo || item.nombre || '').trim(),
        porcentaje: this.aNumero(item.porcentaje || item.peso || item.valor, 0),
        justificacion: String(item.justificacion || ''),
      }))
      .filter((item: any) => item.tipo && item.porcentaje > 0)
      .sort((a: any, b: any) => b.porcentaje - a.porcentaje);

    if (porcentajes.length === 0) {
      return fallback;
    }

    const total = porcentajes.reduce(
      (sum: number, item: any) => sum + item.porcentaje,
      0,
    );
    const ajustados = porcentajes.map((item: any) => ({
      ...item,
      porcentaje: Math.max(1, Math.round((item.porcentaje / total) * 100)),
    }));
    const diferencia =
      100 - ajustados.reduce((sum: number, item: any) => sum + item.porcentaje, 0);
    ajustados[0].porcentaje += diferencia;

    return {
      principal: generado?.principal || ajustados[0].tipo || fallback.principal,
      secundarios:
        Array.isArray(generado?.secundarios) && generado.secundarios.length > 0
          ? generado.secundarios
          : ajustados.slice(1, 4).map((item: any) => item.tipo),
      porcentajes: ajustados,
    };
  }

  private normalizarPasoRuta(
    paso: any,
    index: number,
    recursos: { web: any[]; videos: any[] },
    tema: string,
  ): PasoRuta {
    const recursosPaso = Array.isArray(paso.recursos)
      ? paso.recursos
      : [
          ...(recursos.videos[index] ? [{ tipo: 'youtube', ...recursos.videos[index] }] : []),
          ...(recursos.web[index] ? [{ tipo: 'web', ...recursos.web[index] }] : []),
        ];

    if (recursosPaso.length === 0) {
      const query = encodeURIComponent(`${tema} ${paso.titulo || `paso ${index + 1}`} explicación`);
      recursosPaso.push(
        {
          tipo: 'youtube',
          titulo: `Video sugerido · ${paso.titulo || `Paso ${index + 1}`}`,
          url: `https://www.youtube.com/results?search_query=${query}`,
          embedUrl: `https://www.youtube.com/embed?listType=search&list=${query}`,
          descripcion: 'Video sugerido para reforzar este bloque de la ruta.',
        },
        {
          tipo: 'web',
          titulo: `Lectura sugerida · ${paso.titulo || `Paso ${index + 1}`}`,
          url: `https://www.google.com/search?q=${query}`,
          descripcion: 'Referencia web para ampliar el concepto del paso.',
        },
      );
    }

    const recursosNormalizados: RecursoRuta[] = recursosPaso.map((recurso: any) => {
      const recursoObjeto =
        recurso && typeof recurso === 'object' && !Array.isArray(recurso)
          ? recurso
          : {};
      const recursoTexto = typeof recurso === 'string' ? recurso : '';
      const tipo = this.obtenerTextoRecurso(recursoObjeto.tipo);
      const tituloBase =
        this.obtenerTextoRecurso(recursoObjeto.titulo) ||
        this.obtenerTextoRecurso(recursoObjeto.title) ||
        recursoTexto ||
        '';
      const urlBase =
        this.obtenerUrlRecurso(recursoObjeto, recursoTexto) ||
        this.construirUrlBusquedaRecurso(tituloBase, tema);
      const url = this.normalizarUrlRecurso(urlBase);
      const embed =
        this.obtenerTextoRecurso(recursoObjeto.embedUrl) ||
        this.extraerEmbedYoutube(urlBase || url) ||
        this.construirEmbedBusquedaYoutube(tituloBase, tema);
      const titulo =
        tituloBase && tituloBase !== urlBase
          ? tituloBase
          : embed || /youtube/i.test(url || '')
            ? 'Video recomendado para este paso'
            : url
              ? 'Recurso sugerido'
              : 'Material de apoyo';

      return {
        tipo: ['youtube', 'web', 'actividad', 'lectura', 'mapa'].includes(tipo)
          ? (tipo as RecursoRuta['tipo'])
          : embed
            ? 'youtube'
            : 'web',
        titulo,
        url,
        embedUrl: embed || undefined,
        descripcion:
          this.obtenerTextoRecurso(recursoObjeto.descripcion) ||
          this.obtenerTextoRecurso(recursoObjeto.snippet) ||
          undefined,
        contenido: this.obtenerTextoRecurso(recursoObjeto.contenido) || undefined,
      };
    });

    const recursosDepurados = recursosNormalizados.filter((recurso, indice, lista) => {
      const clave = [
        recurso.tipo || 'material',
        recurso.url || '',
        recurso.embedUrl || '',
        recurso.titulo || '',
      ].join('|');

      return (
        lista.findIndex((item) => {
          const otraClave = [
            item.tipo || 'material',
            item.url || '',
            item.embedUrl || '',
            item.titulo || '',
          ].join('|');
          return otraClave === clave;
        }) === indice
      );
    });

    const videoFallback = recursos.videos[index];
    if (
      videoFallback &&
      !recursosDepurados.some(
        (recurso) => recurso.tipo === 'youtube' && recurso.embedUrl,
      )
    ) {
      recursosDepurados.unshift({
        tipo: 'youtube',
        titulo: String(videoFallback.titulo || `Video de apoyo · ${tema}`),
        url: videoFallback.url,
        embedUrl: videoFallback.embedUrl,
        descripcion:
          videoFallback.descripcion ||
          'Video seleccionado para apoyar este paso de la ruta.',
      });
    }

    const lecturaFallback = recursos.web[index];
    if (
      lecturaFallback &&
      !recursosDepurados.some(
        (recurso) => recurso.tipo === 'web' && recurso.url,
      )
    ) {
      recursosDepurados.push({
        tipo: 'web',
        titulo: String(lecturaFallback.titulo || `Lectura de apoyo · ${tema}`),
        url: lecturaFallback.url,
        descripcion:
          lecturaFallback.descripcion ||
          'Lectura recomendada para profundizar este bloque.',
      });
    }

    if (!recursosDepurados.some((recurso) => recurso.tipo === 'mapa')) {
      recursosDepurados.push({
        tipo: 'mapa',
        titulo: `Mapa conceptual: ${paso.titulo || `Paso ${index + 1}`}`,
        descripcion: 'Resumen visual del paso para facilitar el estudio.',
        contenido: this.construirMapaConceptual(tema, paso),
      });
    }

    if (!recursosDepurados.some((recurso) => recurso.tipo === 'lectura')) {
      recursosDepurados.push({
        tipo: 'lectura',
        titulo: `Lectura guiada: ${paso.titulo || `Paso ${index + 1}`}`,
        descripcion: 'Explicacion breve generada para este punto de estudio.',
        contenido: this.construirLecturaGuiada(tema, paso),
      });
    }

    if (!recursosDepurados.some((recurso) => recurso.tipo === 'actividad')) {
      recursosDepurados.push({
        tipo: 'actividad',
        titulo: `Practica guiada: ${paso.titulo || `Paso ${index + 1}`}`,
        descripcion: 'Actividad puntual para asumir el paso como evidencia.',
        contenido: this.construirActividadGuiada(tema, paso),
      });
    }

    return {
      id: String(paso.id || `paso-${index + 1}`),
      orden: this.aNumero(paso.orden, index + 1),
      titulo: String(paso.titulo || `Paso ${index + 1}`),
      objetivo: String(paso.objetivo || 'Avanzar en la comprensión del tema.'),
      estrategia: String(paso.estrategia || 'Explicación guiada'),
      tipoActividad: String(paso.tipoActividad || paso.tipo || 'clase guiada'),
      descripcion: String(
        paso.descripcion ||
          paso.contenido ||
          'Estudia el concepto central, revisa el recurso sugerido y toma notas.',
      ),
      actividad: String(
        paso.actividad ||
          paso.tarea ||
          'Realiza la actividad propuesta y registra una evidencia breve.',
      ),
      evidenciaEsperada: String(
        paso.evidenciaEsperada ||
          paso.evidencia ||
          'Apunte, ejercicio resuelto o explicación propia.',
      ),
      recursos: recursosDepurados,
      completado: false,
    };
  }

  private extraerEmbedYoutube(url?: string) {
    if (!url) {
      return null;
    }

    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtu.be')) {
        const videoId = parsed.pathname.replace('/', '').trim();
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (parsed.hostname.includes('youtube.com')) {
        if (parsed.pathname.startsWith('/embed/')) {
          const videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0]?.trim();
          return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        }
        const videoId = parsed.searchParams.get('v');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
    } catch {
      return null;
    }

    return null;
  }

  private obtenerTextoRecurso(valor: unknown) {
    if (
      typeof valor === 'string' ||
      typeof valor === 'number' ||
      typeof valor === 'boolean'
    ) {
      return String(valor).trim();
    }

    return '';
  }

  private obtenerUrlRecurso(recurso: Record<string, unknown>, textoLibre = '') {
    const candidatos = [recurso.url, recurso.link, recurso.href, textoLibre];
    const url = candidatos
      .map((valor) => this.obtenerTextoRecurso(valor))
      .find((valor) => /^https?:\/\//i.test(valor));

    return url || undefined;
  }

  private normalizarUrlRecurso(url?: string) {
    if (!url) {
      return undefined;
    }

    try {
      const parsed = new URL(url);
      if (
        parsed.hostname.includes('youtube.com') &&
        parsed.pathname.startsWith('/embed/')
      ) {
        const videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0]?.trim();
        return videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
      }

      return parsed.toString();
    } catch {
      return url;
    }
  }

  private construirUrlBusquedaRecurso(titulo: string, tema: string) {
    if (!titulo || titulo === 'Recurso sugerido') {
      return undefined;
    }

    const consulta = encodeURIComponent(`${tema} ${titulo}`);
    if (/youtube|video/i.test(titulo)) {
      return `https://www.youtube.com/results?search_query=${consulta}`;
    }

    return `https://www.google.com/search?q=${consulta}`;
  }

  private construirEmbedBusquedaYoutube(titulo: string, tema: string) {
    if (!/youtube|video/i.test(titulo)) {
      return undefined;
    }

    return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(`${tema} ${titulo}`)}`;
  }

  private construirMapaConceptual(tema: string, paso: any) {
    const titulo = String(paso?.titulo || 'Paso de aprendizaje');
    const objetivo = String(paso?.objetivo || 'Comprender el tema');
    const estrategia = String(paso?.estrategia || 'Explicación guiada');

    return [
      `Tema central: ${tema}`,
      `Bloque: ${titulo}`,
      `Objetivo: ${objetivo}`,
      `Estrategia sugerida: ${estrategia}`,
      'Conecta conceptos clave, procedimiento y evidencia esperada.',
      'Cierre del paso: sintetiza en 3 ideas lo que comprendiste.',
    ].join('\n');
  }

  private construirLecturaGuiada(tema: string, paso: any) {
    return [
      `Tema: ${tema}`,
      `Paso: ${String(paso?.titulo || 'Bloque de aprendizaje')}`,
      '',
      `Objetivo del paso: ${String(paso?.objetivo || 'Comprender el tema desde una explicacion clara.')}`,
      '',
      `Desarrollo: ${String(paso?.descripcion || 'Revisa el concepto principal, identifica sus elementos clave y conecta la idea con un ejemplo cercano.')}`,
      '',
      `Idea de aplicacion: ${String(paso?.actividad || 'Resume lo aprendido con tus palabras y registra una evidencia breve.')}`,
    ].join('\n');
  }

  private construirActividadGuiada(tema: string, paso: any) {
    return [
      `Actividad sobre ${tema}`,
      '',
      `Instruccion central: ${String(paso?.actividad || 'Realiza la actividad propuesta para este paso.')}`,
      '',
      `Evidencia esperada: ${String(paso?.evidenciaEsperada || 'Entrega una evidencia concreta del ejercicio realizado.')}`,
      '',
      'Checklist rapido:',
      '1. Lee o visualiza el recurso principal.',
      '2. Resuelve o desarrolla la tarea del paso.',
      '3. Revisa tu respuesta y ajusta errores.',
      '4. Guarda la evidencia antes de marcar el paso como completado.',
    ].join('\n');
  }

  private limpiarHtml(texto: string) {
    return texto
      .replace(/<[^>]+>/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private decodificarUrlDuckDuckGo(url: string) {
    try {
      const absoluto = url.startsWith('http')
        ? new URL(url)
        : new URL(url, 'https://duckduckgo.com');
      const destino = absoluto.searchParams.get('uddg');
      return destino ? decodeURIComponent(destino) : absoluto.toString();
    } catch {
      return url;
    }
  }

  private generarRutaLocal(
    asignacion: any,
    respuestas: any[],
    catalogo: any[],
    recursos: { web: any[]; videos: any[] },
  ) {
    const texto = respuestas.map((item) => item.respuesta).join(' ').toLowerCase();
    const puntajes = catalogo.map((tipo) => {
      const nombre = tipo.nombre.toLowerCase();
      let puntos = 8;
      if (texto.includes('video') || texto.includes('ver') || texto.includes('mapa')) {
        puntos += nombre.includes('visual') ? 18 : 0;
      }
      if (texto.includes('escuchar') || texto.includes('explicación')) {
        puntos += nombre.includes('auditivo') || nombre.includes('guiado') ? 16 : 0;
      }
      if (texto.includes('leer') || texto.includes('escribir') || texto.includes('resumen')) {
        puntos += nombre.includes('lector') || nombre.includes('reflexivo') ? 16 : 0;
      }
      if (texto.includes('practicar') || texto.includes('ejercicio') || texto.includes('taller')) {
        puntos += nombre.includes('práctico') || nombre.includes('competitivo') ? 18 : 0;
      }
      if (texto.includes('investigar') || texto.includes('buscar')) {
        puntos += nombre.includes('explorador') ? 18 : 0;
      }
      if (texto.includes('grupo') || texto.includes('compañero')) {
        puntos += nombre.includes('colaborativo') ? 18 : 0;
      }
      return { tipo: tipo.nombre, puntos };
    });
    const total = puntajes.reduce((sum, item) => sum + item.puntos, 0) || 1;
    const porcentajes = puntajes
      .map((item) => ({
        tipo: item.tipo,
        porcentaje: Math.round((item.puntos / total) * 100),
        justificacion: `Afinidad detectada en la entrevista para el perfil ${item.tipo}.`,
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje);
    const principal = porcentajes[0]?.tipo || 'Guiado';
    const estrategias = catalogo.find((item) => item.nombre === principal)?.estrategias || [
      'Explicación paso a paso',
    ];
    const plantillas = [
      {
        titulo: `Punto de partida sobre ${asignacion.tema}`,
        objetivo: 'Reconocer lo que ya sabes, las dudas principales y la meta de aprendizaje.',
        tipoActividad: 'diagnóstico guiado',
        descripcion: `Revisa una explicación introductoria de ${asignacion.tema} y escribe tres ideas que ya entiendes y tres preguntas que necesitas resolver.`,
        actividad:
          principal === 'Visual'
            ? 'Construye un mapa mental inicial con conceptos, ejemplos y dudas.'
            : 'Elabora una lista ordenada de conceptos conocidos, dudas y ejemplos cercanos.',
        evidenciaEsperada: 'Mapa mental, lista diagnóstica o nota inicial.',
      },
      {
        titulo: `Clase guiada: fundamentos de ${asignacion.tema}`,
        objetivo: 'Comprender los conceptos base antes de pasar a ejercicios o aplicación.',
        tipoActividad: 'clase guiada',
        descripcion:
          'Estudia el material sugerido con pausas activas: después de cada idea importante, escribe una explicación breve con tus palabras.',
        actividad:
          principal === 'Auditivo'
            ? 'Escucha o mira una explicación, pausa por secciones y graba o escribe una explicación propia.'
            : 'Lee o mira el recurso principal y construye una explicación corta con un ejemplo.',
        evidenciaEsperada: 'Explicación breve del concepto base.',
      },
      {
        titulo: 'Ejemplos resueltos y patrones',
        objetivo: 'Identificar procedimientos, pasos comunes y errores frecuentes.',
        tipoActividad: 'análisis de ejemplos',
        descripcion:
          'Revisa dos ejemplos del tema. Señala qué se hace primero, qué regla se usa y cómo se comprueba el resultado.',
        actividad:
          principal === 'Reflexivo'
            ? 'Completa una tabla con procedimiento, razón de cada paso y error que se debe evitar.'
            : 'Marca el procedimiento de cada ejemplo y explica por qué cada paso es necesario.',
        evidenciaEsperada: 'Tabla de análisis o ejemplos comentados.',
      },
      {
        titulo: 'Práctica acompañada',
        objetivo: 'Aplicar el tema con apoyo gradual y retroalimentación personal.',
        tipoActividad: 'taller progresivo',
        descripcion:
          'Resuelve ejercicios de dificultad creciente. Primero imita un ejemplo, luego cambia datos y finalmente resuelve uno sin guía.',
        actividad:
          principal === 'Práctico'
            ? 'Resuelve tres ejercicios y escribe el procedimiento completo de cada uno.'
            : 'Desarrolla una práctica corta y explica qué decisión tomaste en cada paso.',
        evidenciaEsperada: 'Ejercicios o actividad aplicada resuelta.',
      },
      {
        titulo: 'Aplicación en contexto',
        objetivo: 'Usar el conocimiento en una situación real o problema nuevo.',
        tipoActividad: 'reto aplicado',
        descripcion:
          'Plantea o resuelve un caso donde el tema tenga utilidad. Conecta el concepto con una situación de clase, vida diaria o proyecto.',
        actividad:
          principal === 'Explorador'
            ? 'Busca una aplicación del tema, valida la fuente y resume cómo se usa.'
            : 'Resuelve un caso aplicado y explica la relación con el concepto estudiado.',
        evidenciaEsperada: 'Caso aplicado, solución comentada o breve investigación.',
      },
      {
        titulo: 'Cierre, síntesis y preparación de evaluación',
        objetivo: 'Consolidar el aprendizaje y prepararse para demostrar comprensión.',
        tipoActividad: 'síntesis y autoevaluación',
        descripcion:
          'Resume lo aprendido, identifica dudas restantes y prepara una explicación final del tema.',
        actividad:
          principal === 'Colaborativo'
            ? 'Explica el tema a un compañero o simula una explicación para otro estudiante.'
            : 'Crea una síntesis final y responde una autoevaluación antes de presentar la evaluación.',
        evidenciaEsperada: 'Síntesis final y autoevaluación corta.',
      },
    ];

    const pasos: PasoRuta[] = plantillas.map((plantilla, index) =>
      this.normalizarPasoRuta(
        {
          id: `paso-${index + 1}`,
          orden: index + 1,
          titulo: plantilla.titulo,
          objetivo: plantilla.objetivo,
          estrategia: estrategias[index % estrategias.length],
          tipoActividad: plantilla.tipoActividad,
          descripcion: plantilla.descripcion,
          actividad: plantilla.actividad,
          evidenciaEsperada: plantilla.evidenciaEsperada,
          recursos: [
            ...(recursos.videos[index]
              ? [{ tipo: 'youtube' as const, ...recursos.videos[index] }]
              : []),
            ...(recursos.web[index]
              ? [{ tipo: 'web' as const, ...recursos.web[index] }]
              : []),
          ],
          completado: false,
        },
        index,
        recursos,
        String(asignacion.tema || 'Tema'),
      ),
    );

    return {
      perfilAprendizaje: {
        principal,
        secundarios: porcentajes.slice(1, 4).map((item) => item.tipo),
        porcentajes,
      },
      diagnostico: {
        nivelDificultad: asignacion.nivelSolicitado || 'medio',
        duracionEstimada: asignacion.tiempoDisponible || '5 a 7 días',
        justificacion:
          'Diagnóstico local basado en las respuestas de entrevista y el objetivo asignado.',
      },
      ruta: {
        titulo: `Ruta adaptativa: ${asignacion.tema}`,
        nivelDificultad: asignacion.nivelSolicitado || 'medio',
        duracionEstimada: asignacion.tiempoDisponible || '5 a 7 días',
        pasos,
        recomendacionesDocente:
          'Revisar evidencias de los pasos y reforzar conceptos con bajo desempeño.',
      },
      evaluacion: {
        instrucciones:
          'Responde con tus palabras. Justifica cuando uses procedimientos o ejemplos.',
        preguntas: [
          {
            id: 'eval-1',
            pregunta: `Explica con tus palabras qué entendiste sobre ${asignacion.tema}.`,
            criterio: 'Claridad conceptual',
            puntajeMaximo: 25,
          },
          {
            id: 'eval-2',
            pregunta: 'Resuelve o describe un ejemplo aplicado del tema.',
            criterio: 'Aplicación',
            puntajeMaximo: 25,
          },
          {
            id: 'eval-3',
            pregunta: 'Menciona un error común y cómo lo evitarías.',
            criterio: 'Reflexión',
            puntajeMaximo: 25,
          },
          {
            id: 'eval-4',
            pregunta: '¿Qué parte del tema podrías explicar a otro compañero?',
            criterio: 'Transferencia',
            puntajeMaximo: 25,
          },
        ],
        tiempoMaximoMinutos: 30,
        iniciadaEn: null,
        limiteEn: null,
        cerradaEn: null,
        cierreMotivo: null,
        estado: 'pendiente',
      },
    };
  }

  private async calificarEvaluacionConIa(asignacion: any, respuestas: any[]) {
    const fallback = () => ({
      puntaje: 75,
      veredicto: 'Requiere revisión docente',
      fortalezas: ['Completó la evaluación y presentó respuestas verificables.'],
      oportunidades: ['El docente debe confirmar profundidad conceptual.'],
      recomendacion: 'Revisar evidencias y decidir si se cierra o se reasigna.',
    });
    const prompt = [
      'Evalúa una ruta de aprendizaje adaptativo. Devuelve SOLO JSON válido.',
      'Llaves requeridas: puntaje (0-100), veredicto, fortalezas, oportunidades, recomendacion.',
      `Tema: ${asignacion.tema}`,
      `Ruta: ${JSON.stringify(asignacion.ruta)}`,
      `Evaluación: ${JSON.stringify(asignacion.evaluacion)}`,
      `Respuestas del estudiante: ${JSON.stringify(respuestas)}`,
    ].join('\n');

    return await this.llamarGeminiJson(prompt, fallback);
  }

  private async llamarGeminiJson<T>(prompt: string, fallback: () => T): Promise<T> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return fallback();
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
              temperature: 0.35,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        return fallback();
      }

      const data = await response.json();
      const texto = this.extraerTextoGemini(data);
      if (!texto) {
        return fallback();
      }

      return JSON.parse(jsonrepair(this.limpiarBloqueJson(texto)));
    } catch {
      return fallback();
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

  private limpiarBloqueJson(texto: string) {
    return texto.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  }

  private obtenerRuta(asignacion: any) {
    const ruta = asignacion.ruta as { pasos?: PasoRuta[] } | null;
    if (!ruta || !Array.isArray(ruta.pasos)) {
      throw new BadRequestException('La ruta todavía no fue generada.');
    }

    return ruta;
  }

  private async generarPdfConclusiones(asignacion: any, revision: any) {
    const carpeta = join(process.cwd(), 'uploads', 'aprendizaje-adaptativo');
    if (!existsSync(carpeta)) {
      mkdirSync(carpeta, { recursive: true });
    }

    const nombreArchivo = `conclusiones-ruta-${asignacion.id}-${Date.now()}.pdf`;
    const rutaAbsoluta = join(carpeta, nombreArchivo);
    const doc = new PDFDocument({ margin: 50 });
    const stream = doc.pipe(createWriteStream(rutaAbsoluta));

    doc.fontSize(18).text('Conclusiones de aprendizaje adaptativo');
    doc.moveDown();
    doc.fontSize(12).text(`Tema: ${asignacion.tema}`);
    doc.text(`Estudiante: ${this.nombreUsuario(asignacion.estudiante)}`);
    doc.text(`Docente: ${this.nombreUsuario(asignacion.docente)}`);
    doc.text(`Institución: ${asignacion.institucion?.nombre || 'Institución'}`);
    doc.moveDown();
    doc.fontSize(14).text('Resultado AI');
    doc.fontSize(11).text(JSON.stringify(asignacion.resultadoEvaluacion || {}, null, 2));
    doc.moveDown();
    doc.fontSize(14).text('Revisión docente');
    doc.fontSize(11).text(revision.observaciones || 'Ruta completada.');
    doc.moveDown();
    doc.text('Documento generado por NEXORA AI.');
    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return {
      rutaAbsoluta,
      rutaPublica: `/uploads/aprendizaje-adaptativo/${nombreArchivo}`,
    };
  }

  private plantillaCorreo(titulo: string, contenido: string) {
    return `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h2 style="color:#070738">${titulo}</h2>
        <p>${contenido}</p>
        <p style="font-size:12px;color:#6b7280">NEXORA AI</p>
      </div>
    `;
  }

  private normalizar(valor: string) {
    return (valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private nombreUsuario(usuario?: {
    nombres?: string | null;
    apellidos?: string | null;
    correo?: string | null;
  }) {
    const nombre = [usuario?.nombres, usuario?.apellidos]
      .filter(Boolean)
      .join(' ')
      .trim();

    return nombre || usuario?.correo || 'Usuario';
  }

  private json<T>(valor: T) {
    return JSON.parse(JSON.stringify(valor));
  }

  private aNumero(valor: unknown, fallback = 0) {
    const numero = Number(String(valor ?? '').replace('%', '').trim());
    return Number.isFinite(numero) ? numero : fallback;
  }
}
