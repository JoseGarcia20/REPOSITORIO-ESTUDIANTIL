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

const ESTADOS_PROYECTO_ACTIVOS = ['activo', 'en_revision', 'requiere_ajustes'];
const VENTANA_ACTIVIDAD_DIAS = 30;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerResumen(usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_VER);
    const esGlobal = tieneAccesoTotal(usuarioAuth);

    if (esGlobal) {
      return await this.obtenerResumenGlobal();
    }

    return await this.obtenerResumenInstitucion(
      Number(usuarioAuth?.institucionId),
    );
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
      usuariosPorInstitucionRaw.map((item) => [item.institucionId, item._count._all]),
    );
    const recursosPorInstitucion = new Map<number, number>(
      recursosPorInstitucionRaw.map((item) => [item.institucionId, item._count._all]),
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
