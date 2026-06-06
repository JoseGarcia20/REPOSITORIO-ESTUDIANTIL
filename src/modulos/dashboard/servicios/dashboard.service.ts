import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import {
  PERMISOS,
  tieneAccesoTotal,
  validarPermiso,
} from '../../auth/utils/roles.util';

type DistribucionRolesGlobal = {
  superadministrador: number;
  administrador: number;
  docente: number;
  estudiante: number;
  usuarioAdministrativo: number;
};

type DistribucionRolesInstitucion = {
  estudiantes: number;
  docentes: number;
  administrativos: number;
};

type ResumenRutaAprendizajeAdaptativo = {
  id: number;
  tema: string;
  estado: string;
  estadoLabel: string;
  fechaAsignacion: Date;
  fechaLimite: Date | null;
  fechaRutaGenerada: Date | null;
  fechaFinalizacion: Date | null;
  progreso: number;
  estudiante: string;
  docente: string;
  tipoAprendizaje: string;
  nivelDificultad: string;
  duracionEstimada: string;
  justificacion: string;
};

type ResumenDiagnosticoAprendizajeAdaptativo = {
  id: number;
  tema: string;
  estudiante: string;
  docente: string;
  tipoAprendizaje: string;
  nivelDificultad: string;
  duracionEstimada: string;
  justificacion: string;
  fechaGeneracion: Date;
  estado: string;
  progreso: number;
};

const ESTADOS_PROYECTO_ACTIVOS = ['activo', 'en_revision', 'requiere_ajustes'];
const VENTANA_ACTIVIDAD_DIAS = 30;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerResumen(usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.FOROS_VER);

    const alcance = this.clasificarAlcance(usuarioAuth);
    const institucionId = Number(usuarioAuth?.institucionId);
    const usuarioId = Number(usuarioAuth?.sub);

    if (alcance === 'global') {
      return await this.obtenerResumenGlobal();
    }

    if (alcance === 'institucion') {
      return await this.obtenerResumenInstitucion(institucionId);
    }

    if (alcance === 'docente') {
      return await this.obtenerResumenDocente(institucionId, usuarioId);
    }

    if (alcance === 'estudiante') {
      return await this.obtenerResumenEstudiante(institucionId, usuarioId);
    }

    return await this.obtenerResumenAdministrativo(institucionId);
  }

  private clasificarAlcance(usuarioAuth: any) {
    if (tieneAccesoTotal(usuarioAuth)) {
      return 'global' as const;
    }

    const rolNormalizado = this.normalizar(usuarioAuth?.rol || '');

    if (rolNormalizado === 'administrador') {
      return 'institucion' as const;
    }

    if (rolNormalizado.includes('docente')) {
      return 'docente' as const;
    }

    if (rolNormalizado.includes('estudiante')) {
      return 'estudiante' as const;
    }

    if (
      rolNormalizado.includes('usuario administrativo') ||
      (rolNormalizado.includes('administrativo') &&
        !rolNormalizado.includes('administrador'))
    ) {
      return 'administrativo' as const;
    }

    if (
      this.tienePermiso(usuarioAuth, PERMISOS.USUARIOS_CREAR) ||
      this.tienePermiso(usuarioAuth, PERMISOS.USUARIOS_VER)
    ) {
      return 'institucion' as const;
    }

    if (this.tienePermiso(usuarioAuth, PERMISOS.REPORTES_VER)) {
      return 'administrativo' as const;
    }

    return 'institucion' as const;
  }

  private async obtenerResumenGlobal() {
    const inicioVentana = this.fechaActividad();

    const [
      institucionesActivas,
      totalUsuarios,
      recursosPublicados,
      forosAbiertos,
      proyectosActivos,
      rutasAsignadas,
      distribucionUsuarios,
      logsRecientes,
      usuariosPorInstitucionRaw,
      recursosPorInstitucionRaw,
      actividadPorInstitucionRaw,
    ] = await Promise.all([
      this.prisma.institucion.findMany({
        where: { estado: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.usuario.count(),
      this.prisma.recurso.count({
        where: { estado: true, publicado: true },
      }),
      this.prisma.foro.count({
        where: { estado: true, cerrado: false },
      }),
      this.prisma.proyectoColaborativo.count({
        where: { estado: { in: ESTADOS_PROYECTO_ACTIVOS } },
      }),
      this.prisma.asignacionRutaAprendizaje.count(),
      this.obtenerDistribucionUsuariosGlobal({}),
      this.obtenerLogsRecientes({}, 10),
      this.prisma.usuario.groupBy({
        by: ['institucionId'],
        _count: { _all: true },
      }),
      this.prisma.recurso.groupBy({
        by: ['institucionId'],
        where: { estado: true },
        _count: { _all: true },
      }),
      this.prisma.auditoriaLog.groupBy({
        by: ['institucionId'],
        where: {
          institucionId: { not: null },
          createdAt: { gte: inicioVentana },
        },
        _count: { _all: true },
      }),
    ]);

    const usuariosPorInstitucion = new Map<number, number>(
      usuariosPorInstitucionRaw.map((item) => [
        item.institucionId,
        item._count._all,
      ]),
    );
    const recursosPorInstitucion = new Map<number, number>(
      recursosPorInstitucionRaw.map((item) => [
        item.institucionId,
        item._count._all,
      ]),
    );
    const actividadPorInstitucion = new Map<number, number>(
      actividadPorInstitucionRaw
        .filter((item) => item.institucionId !== null)
        .map((item) => [Number(item.institucionId), item._count._all]),
    );

    const institucionesResumen = institucionesActivas
      .map((institucion) => ({
        institucionId: institucion.id,
        nombre: institucion.nombre,
        usuarios: usuariosPorInstitucion.get(institucion.id) || 0,
        recursos: recursosPorInstitucion.get(institucion.id) || 0,
        actividad: actividadPorInstitucion.get(institucion.id) || 0,
      }))
      .sort((a, b) => b.usuarios - a.usuarios || b.recursos - a.recursos);

    const institucionesSinActividad = institucionesResumen
      .filter((item) => item.actividad === 0)
      .slice(0, 8);

    const institucionesConMasActividad = [...institucionesResumen]
      .sort((a, b) => b.actividad - a.actividad || b.usuarios - a.usuarios)
      .slice(0, 8);

    return {
      alcance: 'global',
      kpis: [
        {
          key: 'instituciones_activas',
          label: 'Instituciones activas',
          value: institucionesActivas.length,
        },
        { key: 'usuarios_totales', label: 'Usuarios totales', value: totalUsuarios },
        {
          key: 'recursos_publicados',
          label: 'Recursos publicados',
          value: recursosPublicados,
        },
        { key: 'foros_abiertos', label: 'Foros abiertos', value: forosAbiertos },
        {
          key: 'proyectos_activos',
          label: 'Proyectos activos',
          value: proyectosActivos,
        },
        {
          key: 'rutas_asignadas',
          label: 'Rutas asignadas',
          value: rutasAsignadas,
        },
      ],
      distribucionUsuarios,
      usuariosPorInstitucion: institucionesResumen,
      logsRecientes,
      institucionesSinActividad,
      institucionesConMasActividad,
    };
  }

  private async obtenerResumenInstitucion(institucionId: number) {
    const whereInstitucion = { institucionId };

    const [
      institucion,
      totalUsuarios,
      totalEstudiantes,
      totalDocentes,
      totalAdministrativos,
      totalRecursos,
      forosAbiertos,
      proyectosActivos,
      logsRecientes,
      forosRecientesRaw,
      recursosPorCategoriaRaw,
      recursosPorGradoRaw,
    ] = await Promise.all([
      this.prisma.institucion.findUnique({
        where: { id: institucionId },
        select: { id: true, nombre: true },
      }),
      this.prisma.usuario.count({ where: whereInstitucion }),
      this.prisma.usuario.count({
        where: {
          ...whereInstitucion,
          rol: { nombre: { contains: 'estudiante', mode: 'insensitive' } },
        },
      }),
      this.prisma.usuario.count({
        where: {
          ...whereInstitucion,
          rol: { nombre: { contains: 'docente', mode: 'insensitive' } },
        },
      }),
      this.prisma.usuario.count({
        where: {
          ...whereInstitucion,
          OR: [
            { rol: { nombre: { contains: 'administrador', mode: 'insensitive' } } },
            { rol: { nombre: { contains: 'administrativo', mode: 'insensitive' } } },
          ],
        },
      }),
      this.prisma.recurso.count({
        where: { ...whereInstitucion, estado: true },
      }),
      this.prisma.foro.count({
        where: { ...whereInstitucion, estado: true, cerrado: false },
      }),
      this.prisma.proyectoColaborativo.count({
        where: {
          ...whereInstitucion,
          estado: { in: ESTADOS_PROYECTO_ACTIVOS },
        },
      }),
      this.obtenerLogsRecientes({ institucionId }, 10),
      this.prisma.foro.findMany({
        where: { ...whereInstitucion, estado: true },
        include: {
          usuario: {
            select: { nombres: true, apellidos: true, correo: true },
          },
          _count: { select: { comentarios: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.recurso.groupBy({
        by: ['categoriaId'],
        where: { ...whereInstitucion, estado: true },
        _count: { _all: true },
      }),
      this.prisma.recurso.groupBy({
        by: ['gradoEscolarId'],
        where: { ...whereInstitucion, estado: true, gradoEscolarId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const [categorias, grados] = await Promise.all([
      this.prisma.categoria.findMany({
        where: {
          id: { in: recursosPorCategoriaRaw.map((item) => item.categoriaId) },
        },
        select: { id: true, nombre: true },
      }),
      this.prisma.gradoEscolar.findMany({
        where: {
          id: {
            in: recursosPorGradoRaw
              .map((item) => item.gradoEscolarId)
              .filter((valor): valor is number => Boolean(valor)),
          },
        },
        select: { id: true, nombre: true, orden: true },
      }),
    ]);

    const categoriasPorId = new Map(categorias.map((item) => [item.id, item.nombre]));
    const gradosPorId = new Map(grados.map((item) => [item.id, item]));

    const recursosPorCategoria = recursosPorCategoriaRaw
      .map((item) => ({
        id: item.categoriaId,
        nombre: categoriasPorId.get(item.categoriaId) || `Categoría ${item.categoriaId}`,
        total: item._count._all,
      }))
      .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre))
      .slice(0, 12);

    const recursosPorGrado = recursosPorGradoRaw
      .map((item) => {
        const grado = item.gradoEscolarId
          ? gradosPorId.get(item.gradoEscolarId)
          : null;

        return {
          id: item.gradoEscolarId || 0,
          nombre: grado?.nombre || 'Sin grado',
          orden: grado?.orden || 999,
          total: item._count._all,
        };
      })
      .sort((a, b) => a.orden - b.orden || b.total - a.total)
      .map(({ id, nombre, total }) => ({ id, nombre, total }));

    const forosRecientes = forosRecientesRaw.map((foro) => ({
      id: foro.id,
      titulo: foro.titulo,
      createdAt: foro.createdAt,
      publico: foro.publico,
      cerrado: foro.cerrado,
      comentarios: foro._count.comentarios,
      autor: this.nombreUsuario(foro.usuario),
    }));

    return {
      alcance: 'institucion',
      institucion: institucion || { id: institucionId, nombre: 'Institución' },
      kpis: [
        { key: 'usuarios', label: 'Usuarios', value: totalUsuarios },
        { key: 'estudiantes', label: 'Estudiantes', value: totalEstudiantes },
        { key: 'docentes', label: 'Docentes', value: totalDocentes },
        { key: 'recursos', label: 'Recursos', value: totalRecursos },
        { key: 'foros_abiertos', label: 'Foros abiertos', value: forosAbiertos },
        {
          key: 'proyectos_activos',
          label: 'Proyectos activos',
          value: proyectosActivos,
        },
      ],
      distribucionUsuarios: {
        estudiantes: totalEstudiantes,
        docentes: totalDocentes,
        administrativos: totalAdministrativos,
      } satisfies DistribucionRolesInstitucion,
      recursosPorCategoria,
      recursosPorGrado,
      forosRecientes,
      logsRecientes,
    };
  }

  private async obtenerResumenDocente(institucionId: number, usuarioId: number) {
    const whereDocente = {
      institucionId,
      docenteId: usuarioId,
    };

    const [
      institucion,
      misRecursos,
      misForos,
      misProyectos,
      entregasPendientes,
      rutasAdaptativasAsignadas,
      diagnosticosAdaptativosRealizados,
      recursosRecientesRaw,
      forosAbiertosRaw,
      proyectosDocenteRaw,
      entregasPendientesRaw,
      rutasAdaptativasRaw,
      logsRecientes,
    ] = await Promise.all([
      this.prisma.institucion.findUnique({
        where: { id: institucionId },
        select: { id: true, nombre: true },
      }),
      this.prisma.recurso.count({
        where: {
          institucionId,
          usuarioCreadorId: usuarioId,
          estado: true,
        },
      }),
      this.prisma.foro.count({
        where: {
          institucionId,
          usuarioId,
          estado: true,
        },
      }),
      this.prisma.proyectoColaborativo.count({
        where: whereDocente,
      }),
      this.prisma.proyectoColaborativoEntrega.count({
        where: {
          estado: 'entregada',
          fechaRevision: null,
          proyecto: whereDocente,
        },
      }),
      this.prisma.asignacionAprendizajeAdaptativo.count({
        where: {
          institucionId,
          docenteId: usuarioId,
        },
      }),
      this.prisma.asignacionAprendizajeAdaptativo.count({
        where: {
          institucionId,
          docenteId: usuarioId,
          fechaRutaGenerada: { not: null },
        },
      }),
      this.prisma.recurso.findMany({
        where: {
          institucionId,
          usuarioCreadorId: usuarioId,
          estado: true,
        },
        select: {
          id: true,
          titulo: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.foro.findMany({
        where: {
          institucionId,
          usuarioId,
          estado: true,
          cerrado: false,
        },
        select: {
          id: true,
          titulo: true,
          createdAt: true,
          publico: true,
          _count: { select: { comentarios: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      this.prisma.proyectoColaborativo.findMany({
        where: whereDocente,
        select: {
          id: true,
          titulo: true,
          estado: true,
          fechaLimite: true,
          createdAt: true,
          _count: {
            select: {
              integrantes: true,
              actividades: true,
              entregas: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      this.prisma.proyectoColaborativoEntrega.findMany({
        where: {
          estado: 'entregada',
          fechaRevision: null,
          proyecto: whereDocente,
        },
        select: {
          id: true,
          nombreArchivo: true,
          createdAt: true,
          usuario: {
            select: {
              nombres: true,
              apellidos: true,
              correo: true,
            },
          },
          proyecto: {
            select: {
              id: true,
              titulo: true,
              estado: true,
              fechaLimite: true,
            },
          },
        },
        orderBy: [{ createdAt: 'asc' }],
        take: 10,
      }),
      this.prisma.asignacionAprendizajeAdaptativo.findMany({
        where: {
          institucionId,
          docenteId: usuarioId,
        },
        select: {
          id: true,
          tema: true,
          estado: true,
          createdAt: true,
          fechaLimite: true,
          fechaRutaGenerada: true,
          fechaFinalizacion: true,
          ruta: true,
          diagnostico: true,
          perfilAprendizaje: true,
          estudiante: {
            select: {
              nombres: true,
              apellidos: true,
              correo: true,
              gradoEscolar: {
                select: {
                  nombre: true,
                  codigo: true,
                },
              },
            },
          },
          docente: {
            select: {
              nombres: true,
              apellidos: true,
              correo: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.obtenerLogsRecientes({ institucionId, usuarioId }, 6),
    ]);

    const recursoIds = recursosRecientesRaw.map((item) => item.id);
    const valoracionesRaw = recursoIds.length
      ? await this.prisma.calificacionRecurso.groupBy({
          by: ['recursoId'],
          where: {
            estado: true,
            recursoId: { in: recursoIds },
          },
          _avg: { calificacion: true },
          _count: { _all: true },
        })
      : [];

    const valoracionPorRecursoId = new Map(
      valoracionesRaw.map((item) => [
        item.recursoId,
        {
          promedio: Number(item._avg.calificacion || 0),
          total: item._count._all,
        },
      ]),
    );

    const misRecursosRecientes = recursosRecientesRaw.map((item) => {
      const valoracion = valoracionPorRecursoId.get(item.id);
      return {
        id: item.id,
        titulo: item.titulo,
        createdAt: item.createdAt,
        promedioCalificacion: valoracion ? Number(valoracion.promedio.toFixed(2)) : 0,
        totalCalificaciones: valoracion?.total || 0,
      };
    });

    const misForosAbiertos = forosAbiertosRaw.map((foro) => ({
      id: foro.id,
      titulo: foro.titulo,
      createdAt: foro.createdAt,
      publico: foro.publico,
      comentarios: foro._count.comentarios,
    }));

    const proyectosDocente = proyectosDocenteRaw.map((proyecto) => ({
      id: proyecto.id,
      titulo: proyecto.titulo,
      estado: proyecto.estado,
      estadoLabel: this.etiquetaEstado(proyecto.estado),
      fechaLimite: proyecto.fechaLimite,
      integrantes: proyecto._count.integrantes,
      actividades: proyecto._count.actividades,
      entregas: proyecto._count.entregas,
    }));

    const entregasPendientesRevision = entregasPendientesRaw.map((entrega) => ({
      id: entrega.id,
      nombreArchivo: entrega.nombreArchivo,
      createdAt: entrega.createdAt,
      estudiante: this.nombreUsuario(entrega.usuario),
      proyectoId: entrega.proyecto.id,
      proyectoTitulo: entrega.proyecto.titulo,
      estadoProyecto: this.etiquetaEstado(entrega.proyecto.estado),
      fechaLimiteProyecto: entrega.proyecto.fechaLimite,
    }));

    const rutasAprendizajeAdaptativo = rutasAdaptativasRaw.map((asignacion) =>
      this.resumenRutaAprendizajeAdaptativo(asignacion),
    );

    const ultimosDiagnosticosAdaptativos = rutasAprendizajeAdaptativo
      .filter((ruta) => ruta.justificacion)
      .slice(0, 5)
      .map((ruta) => ({
          id: ruta.id,
          tema: ruta.tema,
          estudiante: ruta.estudiante,
          docente: ruta.docente,
        tipoAprendizaje: ruta.tipoAprendizaje,
        nivelDificultad: ruta.nivelDificultad,
        duracionEstimada: ruta.duracionEstimada,
        justificacion: ruta.justificacion,
        fechaGeneracion: ruta.fechaRutaGenerada || ruta.fechaAsignacion,
        estado: ruta.estadoLabel,
        progreso: ruta.progreso,
      }));

    return {
      alcance: 'docente',
      institucion: institucion || { id: institucionId, nombre: 'Institución' },
      kpis: [
        { key: 'mis_recursos', label: 'Mis recursos', value: misRecursos },
        { key: 'mis_foros', label: 'Mis foros', value: misForos },
        { key: 'mis_proyectos', label: 'Mis proyectos', value: misProyectos },
        {
          key: 'entregas_pendientes',
          label: 'Entregas por revisar',
          value: entregasPendientes,
        },
        {
          key: 'rutas_adaptativas',
          label: 'Rutas adaptativas',
          value: rutasAdaptativasAsignadas,
        },
        {
          key: 'diagnosticos_adaptativos',
          label: 'Diagnósticos adaptativos',
          value: diagnosticosAdaptativosRealizados,
        },
      ],
      misRecursosRecientes,
      misForosAbiertos,
      proyectosDocente,
      entregasPendientesRevision,
      rutasAprendizajeAdaptativo,
      ultimosDiagnosticosAdaptativos,
      logsRecientes,
    };
  }

  private async obtenerResumenEstudiante(
    institucionId: number,
    usuarioId: number,
  ) {
    const perfil = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        institucionId: true,
        gradoEscolarId: true,
        gradoEscolar: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
      },
    });

    const gradoEscolarId = perfil?.gradoEscolarId || null;
    const institucionReal = Number(perfil?.institucionId || institucionId);

    const whereForoVisible = {
      OR: [{ publico: true }, { institucionId: institucionReal }],
    };

    const [
      institucion,
      proyectosParticipa,
      forosComentadosRaw,
      rutasAsignadas,
      diagnosticosRealizados,
      rutasAdaptativasAsignadas,
      diagnosticosAdaptativosRealizados,
      proyectosEstudianteRaw,
      rutasAprendizajeRaw,
      rutasAdaptativasRaw,
      ultimoDiagnosticoRaw,
      forosGradoRaw,
    ] = await Promise.all([
      this.prisma.institucion.findUnique({
        where: { id: institucionReal },
        select: { id: true, nombre: true },
      }),
      this.prisma.proyectoColaborativoIntegrante.count({
        where: {
          usuarioId,
          estado: true,
          proyecto: { institucionId: institucionReal },
        },
      }),
      this.prisma.comentarioForo.findMany({
        where: {
          usuarioId,
          estado: true,
          foro: {
            estado: true,
            ...whereForoVisible,
          },
        },
        select: { foroId: true },
        distinct: ['foroId'],
      }),
      this.prisma.asignacionRutaAprendizaje.count({
        where: { usuarioId },
      }),
      this.prisma.diagnosticoAprendizaje.count({
        where: { usuarioId },
      }),
      this.prisma.asignacionAprendizajeAdaptativo.count({
        where: {
          institucionId: institucionReal,
          estudianteId: usuarioId,
        },
      }),
      this.prisma.asignacionAprendizajeAdaptativo.count({
        where: {
          institucionId: institucionReal,
          estudianteId: usuarioId,
          fechaRutaGenerada: { not: null },
        },
      }),
      this.prisma.proyectoColaborativoIntegrante.findMany({
        where: {
          usuarioId,
          estado: true,
          proyecto: {
            institucionId: institucionReal,
          },
        },
        select: {
          id: true,
          rolProyecto: true,
          proyecto: {
            select: {
              id: true,
              titulo: true,
              estado: true,
              fechaLimite: true,
              docente: {
                select: {
                  nombres: true,
                  apellidos: true,
                  correo: true,
                },
              },
            },
          },
        },
        orderBy: { id: 'desc' },
        take: 12,
      }),
      this.prisma.asignacionRutaAprendizaje.findMany({
        where: { usuarioId },
        select: {
          id: true,
          estado: true,
          porcentajeAvance: true,
          fechaAsignacion: true,
          fechaFinalizacion: true,
          rutaAprendizaje: {
            select: {
              id: true,
              titulo: true,
              temaObjetivo: true,
              nivelDificultad: true,
            },
          },
        },
        orderBy: { fechaAsignacion: 'desc' },
        take: 8,
      }),
      this.prisma.asignacionAprendizajeAdaptativo.findMany({
        where: {
          institucionId: institucionReal,
          estudianteId: usuarioId,
        },
        select: {
          id: true,
          tema: true,
          estado: true,
          createdAt: true,
          fechaLimite: true,
          fechaRutaGenerada: true,
          fechaFinalizacion: true,
          ruta: true,
          diagnostico: true,
          perfilAprendizaje: true,
          estudiante: {
            select: {
              nombres: true,
              apellidos: true,
              correo: true,
              gradoEscolar: {
                select: {
                  nombre: true,
                  codigo: true,
                },
              },
            },
          },
          docente: {
            select: {
              nombres: true,
              apellidos: true,
              correo: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.prisma.diagnosticoAprendizaje.findFirst({
        where: { usuarioId },
        select: {
          id: true,
          puntajeFinal: true,
          resultadoFinal: true,
          createdAt: true,
          tipoAprendizaje: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      gradoEscolarId
        ? this.prisma.foro.findMany({
            where: {
              estado: true,
              ...whereForoVisible,
              OR: [
                {
                  recursos: {
                    some: {
                      estado: true,
                      gradoEscolarId,
                    },
                  },
                },
                {
                  comentarios: {
                    some: {
                      estado: true,
                      OR: [
                        {
                          recursos: {
                            some: {
                              estado: true,
                              gradoEscolarId,
                            },
                          },
                        },
                        {
                          recursosCompartidos: {
                            some: {
                              recurso: {
                                estado: true,
                                gradoEscolarId,
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
            select: {
              id: true,
              titulo: true,
              publico: true,
              createdAt: true,
              categoria: {
                select: {
                  nombre: true,
                },
              },
              _count: {
                select: {
                  comentarios: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 8,
          })
        : Promise.resolve([]),
    ]);

    const forosComentados = forosComentadosRaw.length;

    const misProyectos = [...proyectosEstudianteRaw]
      .sort(
        (a, b) =>
          new Date(a.proyecto.fechaLimite).getTime() -
          new Date(b.proyecto.fechaLimite).getTime(),
      )
      .map((integrante) => ({
        id: integrante.id,
        proyectoId: integrante.proyecto.id,
        titulo: integrante.proyecto.titulo,
        estado: integrante.proyecto.estado,
        estadoLabel: this.etiquetaEstado(integrante.proyecto.estado),
        fechaLimite: integrante.proyecto.fechaLimite,
        rolProyecto: this.etiquetaRolProyecto(integrante.rolProyecto),
        docente: this.nombreUsuario(integrante.proyecto.docente),
      }));

    const forosDirigidosGrado = forosGradoRaw.map((foro) => ({
      id: foro.id,
      titulo: foro.titulo,
      createdAt: foro.createdAt,
      publico: foro.publico,
      categoria: foro.categoria?.nombre || 'Sin categoría',
      comentarios: foro._count.comentarios,
    }));

    const misRutasAprendizaje = rutasAprendizajeRaw.map((asignacion) => ({
      id: asignacion.id,
      rutaId: asignacion.rutaAprendizaje.id,
      titulo: asignacion.rutaAprendizaje.titulo,
      temaObjetivo: asignacion.rutaAprendizaje.temaObjetivo,
      nivelDificultad: asignacion.rutaAprendizaje.nivelDificultad,
      estado: asignacion.estado,
      porcentajeAvance: Number(asignacion.porcentajeAvance || 0),
      fechaAsignacion: asignacion.fechaAsignacion,
      fechaFinalizacion: asignacion.fechaFinalizacion,
    }));

    const rutasAprendizajeAdaptativo = rutasAdaptativasRaw.map((asignacion) =>
      this.resumenRutaAprendizajeAdaptativo(asignacion),
    );

    const ultimosDiagnosticosAdaptativos = rutasAprendizajeAdaptativo
      .filter((ruta) => ruta.justificacion || ruta.fechaRutaGenerada)
      .slice(0, 5)
      .map((ruta) => ({
          id: ruta.id,
          tema: ruta.tema,
          estudiante: ruta.estudiante,
          docente: ruta.docente,
        tipoAprendizaje: ruta.tipoAprendizaje,
        nivelDificultad: ruta.nivelDificultad,
          duracionEstimada: ruta.duracionEstimada,
          justificacion: ruta.justificacion,
        fechaGeneracion: ruta.fechaRutaGenerada || ruta.fechaAsignacion,
        estado: ruta.estadoLabel,
        progreso: ruta.progreso,
      }));

    const ultimoDiagnostico = ultimoDiagnosticoRaw
      ? {
          id: ultimoDiagnosticoRaw.id,
          puntajeFinal: Number(ultimoDiagnosticoRaw.puntajeFinal || 0),
          resultadoFinal: ultimoDiagnosticoRaw.resultadoFinal || 'Sin resultado',
          createdAt: ultimoDiagnosticoRaw.createdAt,
          tipoAprendizaje: ultimoDiagnosticoRaw.tipoAprendizaje?.nombre || 'General',
        }
      : null;

    return {
      alcance: 'estudiante',
      institucion: institucion || { id: institucionReal, nombre: 'Institución' },
      gradoEscolar: perfil?.gradoEscolar || null,
      kpis: [
        {
          key: 'proyectos_participo',
          label: 'Proyectos donde participo',
          value: proyectosParticipa,
        },
        {
          key: 'foros_comentados',
          label: 'Foros donde comenté',
          value: forosComentados,
        },
        {
          key: 'rutas_asignadas',
          label: 'Rutas asignadas',
          value: rutasAsignadas,
        },
        {
          key: 'diagnosticos_realizados',
          label: 'Diagnósticos realizados',
          value: diagnosticosRealizados,
        },
        {
          key: 'rutas_adaptativas',
          label: 'Rutas adaptativas',
          value: rutasAdaptativasAsignadas,
        },
        {
          key: 'diagnosticos_adaptativos',
          label: 'Diagnósticos adaptativos',
          value: diagnosticosAdaptativosRealizados,
        },
      ],
      misProyectos,
      forosDirigidosGrado,
      misRutasAprendizaje,
      rutasAprendizajeAdaptativo,
      ultimosDiagnosticosAdaptativos,
      ultimoDiagnostico,
      logsRecientes: [],
    };
  }

  private async obtenerResumenAdministrativo(institucionId: number) {
    const [
      institucion,
      totalUsuarios,
      totalRecursos,
      totalForos,
      totalProyectos,
      logsRecientes,
      recursosPorCategoriaPublicacionRaw,
    ] = await Promise.all([
      this.prisma.institucion.findUnique({
        where: { id: institucionId },
        select: { id: true, nombre: true },
      }),
      this.prisma.usuario.count({
        where: {
          institucionId,
          activo: true,
        },
      }),
      this.prisma.recurso.count({
        where: {
          institucionId,
          estado: true,
        },
      }),
      this.prisma.foro.count({
        where: {
          institucionId,
          estado: true,
        },
      }),
      this.prisma.proyectoColaborativo.count({
        where: {
          institucionId,
          estado: { in: ESTADOS_PROYECTO_ACTIVOS },
        },
      }),
      this.obtenerLogsRecientes({ institucionId }, 15),
      this.prisma.recurso.groupBy({
        by: ['categoriaId', 'publicado'],
        where: {
          institucionId,
          estado: true,
        },
        _count: { _all: true },
      }),
    ]);

    const categoriaIds = Array.from(
      new Set(recursosPorCategoriaPublicacionRaw.map((item) => item.categoriaId)),
    );
    const categorias = categoriaIds.length
      ? await this.prisma.categoria.findMany({
          where: { id: { in: categoriaIds } },
          select: { id: true, nombre: true },
        })
      : [];
    const categoriaNombre = new Map(categorias.map((item) => [item.id, item.nombre]));

    const resumenPorCategoria = new Map<
      number,
      {
        id: number;
        nombre: string;
        publicados: number;
        borradores: number;
        total: number;
      }
    >();

    recursosPorCategoriaPublicacionRaw.forEach((item) => {
      const actual = resumenPorCategoria.get(item.categoriaId) || {
        id: item.categoriaId,
        nombre:
          categoriaNombre.get(item.categoriaId) || `Categoría ${item.categoriaId}`,
        publicados: 0,
        borradores: 0,
        total: 0,
      };

      const total = item._count._all;
      if (item.publicado) {
        actual.publicados += total;
      } else {
        actual.borradores += total;
      }
      actual.total += total;
      resumenPorCategoria.set(item.categoriaId, actual);
    });

    const recursosPublicadosVsBorradores = Array.from(resumenPorCategoria.values())
      .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre))
      .slice(0, 15);

    return {
      alcance: 'administrativo',
      institucion: institucion || { id: institucionId, nombre: 'Institución' },
      kpis: [
        { key: 'usuarios', label: 'Usuarios', value: totalUsuarios },
        { key: 'recursos', label: 'Recursos', value: totalRecursos },
        { key: 'foros', label: 'Foros', value: totalForos },
        { key: 'proyectos', label: 'Proyectos', value: totalProyectos },
      ],
      recursosPublicadosVsBorradores,
      logsRecientes,
    };
  }

  private async obtenerDistribucionUsuariosGlobal(where: Record<string, unknown>) {
    const [roles, agrupado] = await Promise.all([
      this.prisma.rol.findMany({
        select: { id: true, nombre: true },
      }),
      this.prisma.usuario.groupBy({
        by: ['rolId'],
        where,
        _count: { _all: true },
      }),
    ]);

    const rolPorId = new Map(roles.map((rol) => [rol.id, rol.nombre]));
    const distribucion: DistribucionRolesGlobal = {
      superadministrador: 0,
      administrador: 0,
      docente: 0,
      estudiante: 0,
      usuarioAdministrativo: 0,
    };

    agrupado.forEach((item) => {
      const nombreRol = rolPorId.get(item.rolId) || '';
      const llave = this.clasificarRol(nombreRol);
      if (!llave) {
        return;
      }

      distribucion[llave] += item._count._all;
    });

    return distribucion;
  }

  private async obtenerLogsRecientes(
    where: Record<string, unknown>,
    limite: number,
  ) {
    const logs = await this.prisma.auditoriaLog.findMany({
      where,
      include: {
        usuario: {
          select: { nombres: true, apellidos: true, correo: true },
        },
        institucion: {
          select: { nombre: true },
        },
      },
      orderBy: { id: 'desc' },
      take: limite,
    });

    return logs.map((log) => ({
      id: log.id.toString(),
      entidad: log.entidad,
      accion: log.accion,
      createdAt: log.createdAt,
      usuario: this.nombreUsuario(log.usuario),
      institucion: log.institucion?.nombre || 'Sin institución',
      detalle: this.resumenDetalleLog(log.detalles),
    }));
  }

  private clasificarRol(nombreRol: string): keyof DistribucionRolesGlobal | null {
    const normalizado = this.normalizar(nombreRol);

    if (normalizado.includes('superadministrador')) {
      return 'superadministrador';
    }

    if (
      normalizado.includes('usuario administrativo') ||
      normalizado.includes('administrativo')
    ) {
      return 'usuarioAdministrativo';
    }

    if (normalizado.includes('administrador')) {
      return 'administrador';
    }

    if (normalizado.includes('docente')) {
      return 'docente';
    }

    if (normalizado.includes('estudiante')) {
      return 'estudiante';
    }

    return null;
  }

  private etiquetaEstado(estado: string) {
    const etiquetas: Record<string, string> = {
      activo: 'Activo',
      en_revision: 'En revisión',
      requiere_ajustes: 'Requiere ajustes',
      aprobado: 'Aprobado',
      cerrado: 'Cerrado',
      pendiente: 'Pendiente',
      en_progreso: 'En progreso',
      completada: 'Completada',
      entregada: 'Entregada',
      aprobada: 'Aprobada',
      rechazada: 'Rechazada',
    };

    return etiquetas[estado] || estado;
  }

  private etiquetaEstadoAdaptativo(estado: string) {
    const etiquetas: Record<string, string> = {
      asignada: 'Asignada',
      entrevista: 'Entrevista',
      ruta_generada: 'Ruta generada',
      en_curso: 'En curso',
      evaluacion: 'Evaluación',
      evaluada: 'Evaluada',
      revisada: 'Revisada',
      completada: 'Completada',
      reasignada: 'Reasignada',
    };

    return etiquetas[estado] || estado;
  }

  private etiquetaRolProyecto(rolProyecto?: string | null) {
    const rol = this.normalizar(rolProyecto || '').replace(/\s+/g, '_');
    const etiquetas: Record<string, string> = {
      lider: 'Líder',
      investigador: 'Investigador',
      expositor: 'Expositor',
    };

    return etiquetas[rol] || rolProyecto || 'Sin rol';
  }

  private fechaActividad() {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - VENTANA_ACTIVIDAD_DIAS);
    return fecha;
  }

  private normalizar(valor: string) {
    return (valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private calcularProgresoRutaAdaptativa(ruta: any) {
    const pasos = Array.isArray(ruta?.pasos) ? ruta.pasos : [];
    if (pasos.length === 0) {
      return 0;
    }

    const completados = pasos.filter((paso: any) => Boolean(paso?.completado)).length;
    return Math.round((completados / pasos.length) * 100);
  }

  private resumenRutaAprendizajeAdaptativo(asignacion: any): ResumenRutaAprendizajeAdaptativo {
    const ruta = asignacion?.ruta && typeof asignacion.ruta === 'object' ? asignacion.ruta : {};
    const diagnostico =
      asignacion?.diagnostico && typeof asignacion.diagnostico === 'object'
        ? asignacion.diagnostico
        : {};
    const perfil =
      asignacion?.perfilAprendizaje && typeof asignacion.perfilAprendizaje === 'object'
        ? asignacion.perfilAprendizaje
        : {};

    return {
      id: Number(asignacion.id),
      tema: asignacion.tema || 'Ruta adaptativa',
      estado: asignacion.estado || 'asignada',
      estadoLabel: this.etiquetaEstadoAdaptativo(asignacion.estado || 'asignada'),
      fechaAsignacion: asignacion.createdAt || asignacion.fechaAsignacion,
      fechaLimite: asignacion.fechaLimite || null,
      fechaRutaGenerada: asignacion.fechaRutaGenerada || null,
      fechaFinalizacion: asignacion.fechaFinalizacion || null,
      progreso: this.calcularProgresoRutaAdaptativa(ruta),
      estudiante: this.nombreUsuario(asignacion.estudiante),
      docente: this.nombreUsuario(asignacion.docente),
      tipoAprendizaje: perfil?.principal || 'Sin perfil',
      nivelDificultad:
        diagnostico?.nivelDificultad ||
        ruta?.nivelDificultad ||
        asignacion?.nivelSolicitado ||
        'medio',
      duracionEstimada:
        diagnostico?.duracionEstimada ||
        ruta?.duracionEstimada ||
        asignacion?.tiempoDisponible ||
        'Sin dato',
      justificacion: diagnostico?.justificacion || '',
    };
  }

  private tienePermiso(usuarioAuth: any, permiso: string) {
    const permisos = usuarioAuth?.permisos || [];
    return permisos.includes(PERMISOS.SISTEMA_TOTAL) || permisos.includes(permiso);
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

    return nombre || usuario?.correo || 'Sin usuario';
  }

  private resumenDetalleLog(detalles: unknown) {
    if (!detalles) {
      return '';
    }

    if (typeof detalles === 'string') {
      return detalles;
    }

    if (typeof detalles !== 'object') {
      return '';
    }

    const detallesMap = detalles as Record<string, unknown>;
    const candidatos = ['titulo', 'nombre', 'tema', 'usuario', 'correo'];

    const resumen = candidatos
      .map((campo) => detallesMap[campo])
      .filter((valor) => typeof valor === 'string')
      .map((valor) => String(valor).trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(' · ');

    return resumen;
  }
}
