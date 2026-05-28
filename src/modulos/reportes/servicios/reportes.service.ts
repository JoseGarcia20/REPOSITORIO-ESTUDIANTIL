import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import {
  PERMISOS,
  tieneAccesoTotal,
  validarPermiso,
} from '../../auth/utils/roles.util';
import { GenerarReporteDto } from '../dto/generar-reporte.dto';

type RangoFechas = {
  inicio?: Date;
  fin?: Date;
  etiqueta: string;
};

type AlcanceReporte = {
  global: boolean;
  institucionId?: number;
};

type ColumnaReporte = {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
};

type MetricaReporte = {
  label: string;
  value: string | number;
  detail?: string;
};

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerCatalogos(usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.REPORTES_VER);
    const alcance = this.obtenerAlcance(usuarioAuth, {});

    const [instituciones, categorias, gradosEscolares] = await Promise.all([
      tieneAccesoTotal(usuarioAuth)
        ? this.prisma.institucion.findMany({
            where: { estado: true },
            select: { id: true, nombre: true, logo: true },
            orderBy: { nombre: 'asc' },
          })
        : Promise.resolve([]),
      this.prisma.categoria.findMany({
        where: {
          estado: true,
          ...(alcance.global ? {} : { institucionId: alcance.institucionId }),
        },
        select: {
          id: true,
          nombre: true,
          institucion: { select: { id: true, nombre: true } },
        },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.gradoEscolar.findMany({
        where: { estado: true },
        select: { id: true, nombre: true, orden: true },
        orderBy: { orden: 'asc' },
      }),
    ]);

    return {
      instituciones,
      categorias,
      gradosEscolares,
    };
  }

  async generar(data: GenerarReporteDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.REPORTES_VER);
    const rango = this.obtenerRangoFechas(data);
    const alcance = this.obtenerAlcance(usuarioAuth, data);
    const encabezado = await this.construirEncabezado(usuarioAuth, alcance);

    if (data.tipo === 'recursos-institucion') {
      return await this.generarReporteRecursos(
        data,
        rango,
        alcance,
        encabezado,
      );
    }

    if (data.tipo === 'trabajos-colaborativos') {
      return await this.generarReporteTrabajos(
        data,
        rango,
        alcance,
        encabezado,
      );
    }

    return await this.generarReporteUsoRecursos(
      data,
      rango,
      alcance,
      encabezado,
    );
  }

  private async generarReporteRecursos(
    data: GenerarReporteDto,
    rango: RangoFechas,
    alcance: AlcanceReporte,
    encabezado: any,
  ) {
    const where = {
      ...this.filtroAlcance(alcance),
      ...this.filtroFechas(rango),
      ...this.filtroNumero('categoriaId', data.categoriaId),
      ...this.filtroNumero('gradoEscolarId', data.gradoEscolarId),
    };
    const recursos = await this.prisma.recurso.findMany({
      where,
      include: {
        institucion: { select: { nombre: true } },
        categoria: { select: { nombre: true } },
        tipoRecurso: { select: { nombre: true } },
        gradoEscolar: { select: { nombre: true } },
        usuarioCreador: { select: { nombres: true, apellidos: true } },
        calificaciones: {
          where: { estado: true },
          include: {
            usuario: {
              select: {
                nombres: true,
                apellidos: true,
                correo: true,
                rol: { select: { nombre: true } },
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const totalCalificaciones = recursos.reduce(
      (total, recurso) => total + recurso.calificaciones.length,
      0,
    );
    const sumaCalificaciones = recursos.reduce(
      (total, recurso) =>
        total +
        recurso.calificaciones.reduce(
          (subtotal, item) => subtotal + item.calificacion,
          0,
        ),
      0,
    );
    const promedioGeneral =
      totalCalificaciones > 0 ? sumaCalificaciones / totalCalificaciones : 0;

    return {
      tipo: data.tipo,
      titulo: 'Estadística de recursos institucionales',
      descripcion:
        'Inventario de recursos académicos con calificaciones y usuarios evaluadores.',
      generadoEn: new Date().toISOString(),
      encabezado,
      periodo: rango.etiqueta,
      filtros: await this.construirFiltros(data, alcance),
      metricas: [
        { label: 'Recursos', value: recursos.length },
        {
          label: 'Publicados',
          value: recursos.filter((recurso) => recurso.publicado).length,
        },
        {
          label: 'Calificaciones',
          value: totalCalificaciones,
          detail: `Promedio general ${this.formatearNumero(promedioGeneral)}`,
        },
        {
          label: 'Con valoración',
          value: recursos.filter((recurso) => recurso.calificaciones.length > 0)
            .length,
        },
      ] satisfies MetricaReporte[],
      columnas: [
        { key: 'titulo', label: 'Recurso' },
        { key: 'categoria', label: 'Categoría' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'grado', label: 'Grado' },
        { key: 'responsable', label: 'Responsable' },
        { key: 'fecha', label: 'Fecha' },
        { key: 'estado', label: 'Estado' },
        { key: 'promedio', label: 'Puntuación', align: 'right' },
        { key: 'calificadores', label: 'Usuarios que calificaron' },
      ] satisfies ColumnaReporte[],
      filas: recursos.map((recurso) => {
        const promedio = this.promedioCalificaciones(recurso.calificaciones);

        return {
          titulo: recurso.titulo,
          categoria: recurso.categoria?.nombre || 'Sin categoría',
          tipo: recurso.tipoRecurso?.nombre || 'Sin tipo',
          grado: recurso.gradoEscolar?.nombre || 'Sin grado',
          responsable: this.nombreUsuario(recurso.usuarioCreador),
          fecha: this.formatearFecha(recurso.createdAt),
          estado: `${recurso.estado ? 'Activo' : 'Inactivo'} / ${
            recurso.publicado ? 'Publicado' : 'No publicado'
          }`,
          promedio:
            recurso.calificaciones.length > 0
              ? `${this.formatearNumero(promedio)} (${recurso.calificaciones.length})`
              : 'Sin calificar',
          calificadores:
            recurso.calificaciones.length > 0
              ? recurso.calificaciones
                  .map(
                    (item) =>
                      `${this.nombreUsuario(item.usuario)}: ${this.formatearNumero(
                        item.calificacion,
                      )}`,
                  )
                  .join('; ')
              : 'Sin usuarios',
        };
      }),
      notas: [],
    };
  }

  private async generarReporteTrabajos(
    data: GenerarReporteDto,
    rango: RangoFechas,
    alcance: AlcanceReporte,
    encabezado: any,
  ) {
    const where = {
      ...this.filtroAlcance(alcance),
      ...this.filtroFechas(rango),
      ...this.filtroNumero('categoriaId', data.categoriaId),
      ...this.filtroNumero('gradoEscolarId', data.gradoEscolarId),
      ...(data.estadoProyecto ? { estado: data.estadoProyecto } : {}),
    };
    const proyectos = await this.prisma.proyectoColaborativo.findMany({
      where,
      include: {
        institucion: { select: { nombre: true } },
        docente: { select: { nombres: true, apellidos: true, correo: true } },
        gradoEscolar: { select: { nombre: true } },
        categoria: { select: { nombre: true } },
        integrantes: {
          where: { estado: true },
          include: {
            usuario: {
              select: {
                nombres: true,
                apellidos: true,
                correo: true,
                rol: { select: { nombre: true } },
              },
            },
          },
        },
        actividades: { select: { estado: true } },
        entregas: {
          include: {
            usuario: { select: { nombres: true, apellidos: true } },
            recurso: {
              select: {
                id: true,
                titulo: true,
                publicado: true,
                rutaRecurso: true,
                urlRecurso: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    const recursosPublicados = proyectos.reduce(
      (total, proyecto) =>
        total +
        proyecto.entregas.filter((entrega) => Boolean(entrega.recurso)).length,
      0,
    );

    return {
      tipo: data.tipo,
      titulo: 'Reporte de trabajos colaborativos',
      descripcion:
        'Relación de proyectos, participación, actividades y recurso resultante.',
      generadoEn: new Date().toISOString(),
      encabezado,
      periodo: rango.etiqueta,
      filtros: await this.construirFiltros(data, alcance),
      metricas: [
        { label: 'Proyectos', value: proyectos.length },
        {
          label: 'Aprobados',
          value: proyectos.filter((proyecto) => proyecto.estado === 'aprobado')
            .length,
        },
        {
          label: 'En revisión',
          value: proyectos.filter(
            (proyecto) => proyecto.estado === 'en_revision',
          ).length,
        },
        { label: 'Recursos resultantes', value: recursosPublicados },
      ] satisfies MetricaReporte[],
      columnas: [
        { key: 'titulo', label: 'Trabajo colaborativo' },
        { key: 'docente', label: 'Docente' },
        { key: 'categoria', label: 'Categoría' },
        { key: 'grado', label: 'Grado' },
        { key: 'estado', label: 'Estado' },
        { key: 'integrantes', label: 'Integrantes', align: 'right' },
        { key: 'actividades', label: 'Actividades' },
        { key: 'calificacion', label: 'Calificación', align: 'right' },
        { key: 'recurso', label: 'Recurso resultante' },
      ] satisfies ColumnaReporte[],
      filas: proyectos.map((proyecto) => {
        const recursoResultante = proyecto.entregas.find(
          (entrega) => entrega.recurso,
        )?.recurso;

        return {
          titulo: `${proyecto.titulo} (${this.formatearFecha(
            proyecto.createdAt,
          )})`,
          docente: this.nombreUsuario(proyecto.docente),
          categoria: proyecto.categoria?.nombre || 'Sin categoría',
          grado: proyecto.gradoEscolar?.nombre || 'Sin grado',
          estado: this.etiquetaEstado(proyecto.estado),
          integrantes: proyecto.integrantes.length,
          actividades: this.resumirConteo(
            proyecto.actividades.map((actividad) =>
              this.etiquetaEstado(actividad.estado),
            ),
          ),
          calificacion:
            proyecto.calificacion !== null &&
            proyecto.calificacion !== undefined
              ? this.formatearNumero(proyecto.calificacion)
              : 'Sin calificar',
          recurso: recursoResultante
            ? `${recursoResultante.titulo} ${
                recursoResultante.publicado ? '(publicado)' : '(no publicado)'
              }`
            : 'Sin recurso resultante',
        };
      }),
      notas: [],
    };
  }

  private async generarReporteUsoRecursos(
    data: GenerarReporteDto,
    rango: RangoFechas,
    alcance: AlcanceReporte,
    encabezado: any,
  ) {
    const modulo = data.moduloUso || 'todos';
    const limite = Math.min(this.numeroPositivo(data.limite) || 10, 50);
    const recursos = await this.prisma.recurso.findMany({
      where: {
        ...this.filtroAlcance(alcance),
        ...this.filtroNumero('categoriaId', data.categoriaId),
        ...this.filtroNumero('gradoEscolarId', data.gradoEscolarId),
      },
      include: {
        categoria: { select: { nombre: true } },
        tipoRecurso: { select: { nombre: true } },
        gradoEscolar: { select: { nombre: true } },
        calificaciones: {
          where: { estado: true, ...this.filtroFechas(rango) },
          select: { id: true },
        },
        comentariosCompartidos: {
          where: this.filtroFechas(rango),
          include: {
            comentarioForo: {
              select: {
                foro: { select: { titulo: true } },
              },
            },
          },
        },
        detallesRutaAprendizaje: {
          where: this.filtroFechas(rango),
          include: {
            rutaAprendizaje: { select: { titulo: true } },
          },
        },
        entregaAulaColaborativa: {
          include: {
            proyecto: {
              select: { titulo: true, createdAt: true, fechaCierre: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const filasBase = recursos
      .map((recurso) => {
        const aula =
          recurso.entregaAulaColaborativa &&
          this.fechaEnRango(recurso.entregaAulaColaborativa.createdAt, rango)
            ? 1
            : 0;
        const conteos = {
          foros: recurso.comentariosCompartidos.length,
          aula,
          rutas: recurso.detallesRutaAprendizaje.length,
          calificaciones: recurso.calificaciones.length,
        };
        const total =
          modulo === 'todos'
            ? conteos.foros +
              conteos.aula +
              conteos.rutas +
              conteos.calificaciones
            : conteos[modulo as keyof typeof conteos] || 0;

        return {
          recurso,
          conteos,
          total,
        };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total || b.recurso.id - a.recurso.id)
      .slice(0, limite);

    const totalUsos = filasBase.reduce((total, item) => total + item.total, 0);

    return {
      tipo: data.tipo,
      titulo: 'Recursos más usados en módulos',
      descripcion:
        'Ranking de recursos según usos registrados en foros, aula colaborativa, rutas y calificaciones.',
      generadoEn: new Date().toISOString(),
      encabezado,
      periodo: rango.etiqueta,
      filtros: await this.construirFiltros(data, alcance),
      metricas: [
        { label: 'Recursos con uso', value: filasBase.length },
        { label: 'Usos registrados', value: totalUsos },
        {
          label: 'Módulo',
          value: this.etiquetaModuloUso(modulo),
        },
        { label: 'Límite', value: limite },
      ] satisfies MetricaReporte[],
      columnas: [
        { key: 'titulo', label: 'Recurso' },
        { key: 'categoria', label: 'Categoría' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'grado', label: 'Grado' },
        { key: 'foros', label: 'Foros', align: 'right' },
        { key: 'aula', label: 'Aula', align: 'right' },
        { key: 'rutas', label: 'Rutas', align: 'right' },
        { key: 'calificaciones', label: 'Calificaciones', align: 'right' },
        { key: 'total', label: 'Total', align: 'right' },
      ] satisfies ColumnaReporte[],
      filas: filasBase.map(({ recurso, conteos, total }) => ({
        titulo: recurso.titulo,
        categoria: recurso.categoria?.nombre || 'Sin categoría',
        tipo: recurso.tipoRecurso?.nombre || 'Sin tipo',
        grado: recurso.gradoEscolar?.nombre || 'Sin grado',
        foros: conteos.foros,
        aula: conteos.aula,
        rutas: conteos.rutas,
        calificaciones: conteos.calificaciones,
        total,
      })),
      notas: [],
    };
  }

  private obtenerRangoFechas(data: GenerarReporteDto): RangoFechas {
    const inicio = data.fechaInicio
      ? this.parsearFecha(data.fechaInicio, false)
      : undefined;
    const fin = data.fechaFin
      ? this.parsearFecha(data.fechaFin, true)
      : undefined;

    if (inicio && fin && inicio > fin) {
      throw new BadRequestException(
        'La fecha inicial no puede ser mayor a la fecha final',
      );
    }

    return {
      inicio,
      fin,
      etiqueta:
        inicio || fin
          ? `${inicio ? this.formatearFecha(inicio) : 'Inicio'} - ${
              fin ? this.formatearFecha(fin) : 'Actualidad'
            }`
          : 'Todo el histórico disponible',
    };
  }

  private parsearFecha(valor: string, finDia: boolean) {
    const fecha = new Date(
      `${valor}T${finDia ? '23:59:59.999' : '00:00:00.000'}`,
    );

    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException(`Fecha inválida: ${valor}`);
    }

    return fecha;
  }

  private obtenerAlcance(
    usuarioAuth: any,
    data: Pick<GenerarReporteDto, 'institucionId'>,
  ): AlcanceReporte {
    const institucionSolicitada = this.numeroPositivo(data.institucionId);

    if (tieneAccesoTotal(usuarioAuth)) {
      return institucionSolicitada
        ? { global: false, institucionId: institucionSolicitada }
        : { global: true };
    }

    if (
      institucionSolicitada &&
      institucionSolicitada !== Number(usuarioAuth?.institucionId)
    ) {
      throw new ForbiddenException(
        'No tiene permisos para generar reportes de otra institución',
      );
    }

    return {
      global: false,
      institucionId: Number(usuarioAuth?.institucionId),
    };
  }

  private async construirEncabezado(usuarioAuth: any, alcance: AlcanceReporte) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: Number(usuarioAuth?.sub || 0) },
      include: {
        institucion: true,
        rol: { select: { nombre: true } },
      },
    });
    const institucion = alcance.institucionId
      ? await this.prisma.institucion.findUnique({
          where: { id: alcance.institucionId },
        })
      : null;

    return {
      software: alcance.global,
      nombreEmisor: alcance.global
        ? 'Plataforma Estudiantil'
        : institucion?.nombre || usuario?.institucion?.nombre || 'Institución',
      nit: alcance.global
        ? ''
        : institucion?.nit || usuario?.institucion?.nit || '',
      ubicacion: alcance.global
        ? 'Reporte general del sistema'
        : [
            institucion?.ciudad || usuario?.institucion?.ciudad,
            institucion?.departamento || usuario?.institucion?.departamento,
          ]
            .filter(Boolean)
            .join(', '),
      logo: alcance.global
        ? ''
        : institucion?.logo || usuario?.institucion?.logo || '',
      generadoPor: usuario
        ? this.nombreUsuario(usuario)
        : 'Usuario del sistema',
      rolGenerador: usuario?.rol?.nombre || '',
    };
  }

  private async construirFiltros(
    data: GenerarReporteDto,
    alcance: AlcanceReporte,
  ) {
    const [institucion, categoria, grado] = await Promise.all([
      alcance.institucionId
        ? this.prisma.institucion.findUnique({
            where: { id: alcance.institucionId },
            select: { nombre: true },
          })
        : Promise.resolve(null),
      this.numeroPositivo(data.categoriaId)
        ? this.prisma.categoria.findUnique({
            where: { id: Number(data.categoriaId) },
            select: { nombre: true },
          })
        : Promise.resolve(null),
      this.numeroPositivo(data.gradoEscolarId)
        ? this.prisma.gradoEscolar.findUnique({
            where: { id: Number(data.gradoEscolarId) },
            select: { nombre: true },
          })
        : Promise.resolve(null),
    ]);

    return [
      {
        label: 'Alcance',
        value: alcance.global
          ? 'Reporte general del sistema'
          : institucion?.nombre || 'Institución del usuario',
      },
      categoria ? { label: 'Categoría', value: categoria.nombre } : null,
      grado ? { label: 'Grado escolar', value: grado.nombre } : null,
      data.estadoProyecto
        ? {
            label: 'Estado del proyecto',
            value: this.etiquetaEstado(data.estadoProyecto),
          }
        : null,
      data.moduloUso
        ? {
            label: 'Módulo de uso',
            value: this.etiquetaModuloUso(data.moduloUso),
          }
        : null,
    ].filter(Boolean);
  }

  private filtroAlcance(alcance: AlcanceReporte) {
    return alcance.global ? {} : { institucionId: alcance.institucionId };
  }

  private filtroFechas(rango: RangoFechas) {
    if (!rango.inicio && !rango.fin) {
      return {};
    }

    return {
      createdAt: {
        ...(rango.inicio ? { gte: rango.inicio } : {}),
        ...(rango.fin ? { lte: rango.fin } : {}),
      },
    };
  }

  private filtroNumero(campo: string, valor?: string | number | null) {
    const numero = this.numeroPositivo(valor);
    return numero ? { [campo]: numero } : {};
  }

  private numeroPositivo(valor?: string | number | null) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : null;
  }

  private promedioCalificaciones(
    calificaciones: Array<{ calificacion: number }>,
  ) {
    if (calificaciones.length === 0) {
      return 0;
    }

    return (
      calificaciones.reduce((total, item) => total + item.calificacion, 0) /
      calificaciones.length
    );
  }

  private fechaEnRango(fecha: Date, rango: RangoFechas) {
    if (rango.inicio && fecha < rango.inicio) {
      return false;
    }

    if (rango.fin && fecha > rango.fin) {
      return false;
    }

    return true;
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

  private formatearFecha(fecha?: Date | string | null) {
    if (!fecha) {
      return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
    }).format(new Date(fecha));
  }

  private formatearNumero(valor: number) {
    return new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 2,
    }).format(valor);
  }

  private resumirConteo(valores: string[]) {
    if (valores.length === 0) {
      return 'Sin registros';
    }

    const conteo = valores.reduce<Record<string, number>>(
      (acumulado, valor) => {
        acumulado[valor] = (acumulado[valor] || 0) + 1;
        return acumulado;
      },
      {},
    );

    return Object.entries(conteo)
      .map(([estado, total]) => `${estado}: ${total}`)
      .join('; ');
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

  private etiquetaModuloUso(modulo: string) {
    const etiquetas: Record<string, string> = {
      todos: 'Todos los módulos',
      foros: 'Foros académicos',
      aula: 'Aula colaborativa',
      rutas: 'Rutas de aprendizaje',
      calificaciones: 'Calificaciones',
    };

    return etiquetas[modulo] || modulo;
  }
}
