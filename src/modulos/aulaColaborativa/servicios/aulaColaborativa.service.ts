import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import {
  ConsultaPaginada,
  obtenerPaginacion,
  respuestaPaginada,
} from '../../../comun/paginacion';
import {
  PERMISOS,
  tieneAccesoTotal,
  tienePermiso,
  validarAlcanceInstitucional,
  validarPermiso,
} from '../../auth/utils/roles.util';
import { RecursoService } from '../../recursos/servicios/recurso.service';
import { CrearProyectoColaborativoDto } from '../dto/crear-proyecto-colaborativo.dto';
import { CrearActividadColaborativaDto } from '../dto/crear-actividad-colaborativa.dto';
import { ActualizarEstadoActividadDto } from '../dto/actualizar-estado-actividad.dto';
import { SubirEvidenciaDto } from '../dto/subir-evidencia.dto';
import { CrearEntregaColaborativaDto } from '../dto/crear-entrega-colaborativa.dto';
import { RevisarEntregaColaborativaDto } from '../dto/revisar-entrega-colaborativa.dto';

@Injectable()
export class AulaColaborativaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recursoService: RecursoService,
  ) {}

  private readonly rolesProyecto = ['lider', 'investigador', 'expositor'];
  private readonly estadosActividad = [
    'pendiente',
    'en_progreso',
    'en_revision',
    'completada',
  ];

  private readonly includeProyectoDetalle = {
    institucion: {
      select: {
        id: true,
        nombre: true,
      },
    },
    docente: {
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        rol: {
          select: {
            nombre: true,
          },
        },
      },
    },
    gradoEscolar: {
      select: {
        id: true,
        nombre: true,
        codigo: true,
        orden: true,
      },
    },
    categoria: {
      select: {
        id: true,
        nombre: true,
        color: true,
      },
    },
    integrantes: {
      where: {
        estado: true,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            correo: true,
            institucionId: true,
            gradoEscolarId: true,
            gradoEscolar: {
              select: {
                id: true,
                nombre: true,
              },
            },
            rol: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: 'asc' as const,
      },
    },
    actividades: {
      include: {
        responsable: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
        creador: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
        evidencias: {
          where: {
            estado: true,
          },
          include: {
            usuario: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
              },
            },
          },
          orderBy: {
            id: 'desc' as const,
          },
        },
      },
      orderBy: {
        id: 'asc' as const,
      },
    },
    entregas: {
      include: {
        usuario: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
        recurso: {
          select: {
            id: true,
            titulo: true,
            palabrasClave: true,
          },
        },
      },
      orderBy: {
        id: 'desc' as const,
      },
    },
  };

  private normalizarTexto(valor?: string | null) {
    return (valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private normalizarRolProyecto(rol: string) {
    return this.normalizarTexto(rol).replace(/\s+/g, '_');
  }

  private validarRolProyecto(rol: string) {
    const rolNormalizado = this.normalizarRolProyecto(rol);

    if (!this.rolesProyecto.includes(rolNormalizado)) {
      throw new BadRequestException(
        'El rol del proyecto debe ser lider, investigador o expositor',
      );
    }

    return rolNormalizado;
  }

  private validarEstadoActividad(estado: string) {
    const estadoNormalizado = this.normalizarTexto(estado).replace(/\s+/g, '_');

    if (!this.estadosActividad.includes(estadoNormalizado)) {
      throw new BadRequestException('Estado de actividad no válido');
    }

    return estadoNormalizado;
  }

  private esAdministradorInstitucional(usuarioAuth: any) {
    const rol = this.normalizarTexto(usuarioAuth?.rol);
    return tieneAccesoTotal(usuarioAuth) || rol === 'administrador';
  }

  private usuarioEsIntegrante(proyecto: any, usuarioId: number) {
    return (proyecto.integrantes || []).some(
      (integrante) =>
        integrante.estado !== false &&
        Number(integrante.usuarioId) === usuarioId,
    );
  }

  private usuarioEsLider(proyecto: any, usuarioId: number) {
    return (proyecto.integrantes || []).some(
      (integrante) =>
        integrante.estado !== false &&
        Number(integrante.usuarioId) === usuarioId &&
        this.normalizarRolProyecto(integrante.rolProyecto) === 'lider',
    );
  }

  private validarProyectoEditable(proyecto: any) {
    if (['aprobado', 'cerrado'].includes(proyecto.estado)) {
      throw new BadRequestException(
        'El proyecto ya está cerrado para nuevas acciones',
      );
    }
  }

  private tieneEntregaPendienteRevision(proyecto: any) {
    return (proyecto.entregas || []).some(
      (entrega) => entrega.estado === 'entregada' && !entrega.fechaRevision,
    );
  }

  private validarSinEntregaPendiente(proyecto: any) {
    if (this.tieneEntregaPendienteRevision(proyecto)) {
      throw new BadRequestException(
        'El proyecto tiene una entrega pendiente de revisión del docente',
      );
    }
  }

  private construirFiltroAlcance(
    usuarioAuth: any,
    query: ConsultaPaginada,
  ): Prisma.ProyectoColaborativoWhereInput {
    if (tieneAccesoTotal(usuarioAuth)) {
      return query.institucionId
        ? { institucionId: Number(query.institucionId) }
        : {};
    }

    const institucionId = Number(usuarioAuth?.institucionId);

    if (this.esAdministradorInstitucional(usuarioAuth)) {
      return { institucionId };
    }

    const usuarioId = Number(usuarioAuth?.sub);

    return {
      institucionId,
      OR: [
        { docenteId: usuarioId },
        {
          integrantes: {
            some: {
              usuarioId,
              estado: true,
            },
          },
        },
      ],
    };
  }

  private async validarEstudiantesInstitucion(
    usuarioIds: number[],
    institucionId: number,
  ) {
    const estudiantes = await this.prisma.usuario.findMany({
      where: {
        id: {
          in: usuarioIds,
        },
        activo: true,
        institucionId,
        rol: {
          nombre: 'estudiante',
        },
      },
      select: {
        id: true,
      },
    });

    if (estudiantes.length !== usuarioIds.length) {
      throw new BadRequestException(
        'Todos los integrantes deben ser estudiantes activos de la institución',
      );
    }
  }

  private async obtenerProyectoConAcceso(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.AULA_COLABORATIVA_VER);

    const proyecto = await this.prisma.proyectoColaborativo.findUnique({
      where: { id },
      include: this.includeProyectoDetalle,
    });

    if (!proyecto) {
      throw new NotFoundException(
        `Proyecto colaborativo con id ${id} no encontrado`,
      );
    }

    validarAlcanceInstitucional(usuarioAuth, proyecto.institucionId);

    if (
      !this.esAdministradorInstitucional(usuarioAuth) &&
      proyecto.docenteId !== Number(usuarioAuth?.sub) &&
      !this.usuarioEsIntegrante(proyecto, Number(usuarioAuth?.sub))
    ) {
      throw new ForbiddenException('No tiene acceso a este proyecto');
    }

    return proyecto;
  }

  private validarGestionProyecto(
    proyecto: any,
    usuarioAuth: any,
    permitirLider = false,
  ) {
    const usuarioId = Number(usuarioAuth?.sub);

    if (
      this.esAdministradorInstitucional(usuarioAuth) ||
      proyecto.docenteId === usuarioId
    ) {
      return;
    }

    if (permitirLider && this.usuarioEsLider(proyecto, usuarioId)) {
      return;
    }

    throw new ForbiddenException('No puede gestionar este proyecto');
  }

  private validarParticipacionProyecto(proyecto: any, usuarioAuth: any) {
    const usuarioId = Number(usuarioAuth?.sub);

    if (
      this.esAdministradorInstitucional(usuarioAuth) ||
      proyecto.docenteId === usuarioId ||
      this.usuarioEsIntegrante(proyecto, usuarioId)
    ) {
      return;
    }

    throw new ForbiddenException('No puede participar en este proyecto');
  }

  async catalogos(usuarioAuth: any, query: ConsultaPaginada = {}) {
    validarPermiso(usuarioAuth, PERMISOS.AULA_COLABORATIVA_VER);

    const institucionId = tieneAccesoTotal(usuarioAuth)
      ? Number(query.institucionId || 0)
      : Number(usuarioAuth?.institucionId);

    const [instituciones, categorias, gradosEscolares, estudiantes] =
      await Promise.all([
        tieneAccesoTotal(usuarioAuth)
          ? this.prisma.institucion.findMany({
              where: { estado: true },
              select: { id: true, nombre: true, estado: true },
              orderBy: { nombre: 'asc' },
            })
          : Promise.resolve([]),
        institucionId
          ? this.prisma.categoria.findMany({
              where: {
                estado: true,
                institucionId,
              },
              orderBy: { nombre: 'asc' },
            })
          : Promise.resolve([]),
        this.prisma.gradoEscolar.findMany({
          where: { estado: true },
          orderBy: { orden: 'asc' },
        }),
        institucionId
          ? this.prisma.usuario.findMany({
              where: {
                activo: true,
                institucionId,
                rol: { nombre: 'estudiante' },
              },
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                correo: true,
                institucionId: true,
                rolId: true,
                gradoEscolarId: true,
                gradoEscolar: {
                  select: {
                    id: true,
                    nombre: true,
                    codigo: true,
                    orden: true,
                  },
                },
              },
              orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
            })
          : Promise.resolve([]),
      ]);

    return {
      instituciones,
      categorias,
      gradosEscolares,
      estudiantes,
    };
  }

  async listar(usuarioAuth: any, query: ConsultaPaginada = {}) {
    validarPermiso(usuarioAuth, PERMISOS.AULA_COLABORATIVA_VER);
    const { pagina, limite, skip, busqueda } = obtenerPaginacion(query);
    const condiciones: Prisma.ProyectoColaborativoWhereInput[] = [
      this.construirFiltroAlcance(usuarioAuth, query),
    ];

    if (query.estado) {
      condiciones.push({ estado: String(query.estado) });
    }

    if (query.gradoEscolarId) {
      condiciones.push({ gradoEscolarId: Number(query.gradoEscolarId) });
    }

    if (busqueda) {
      condiciones.push({
        OR: [
          { titulo: { contains: busqueda, mode: 'insensitive' } },
          { descripcion: { contains: busqueda, mode: 'insensitive' } },
          { objetivo: { contains: busqueda, mode: 'insensitive' } },
        ],
      });
    }

    const where = { AND: condiciones };

    const [data, total] = await Promise.all([
      this.prisma.proyectoColaborativo.findMany({
        where,
        include: this.includeProyectoDetalle,
        orderBy: { id: 'desc' },
        skip,
        take: limite,
      }),
      this.prisma.proyectoColaborativo.count({ where }),
    ]);

    return respuestaPaginada(data, total, pagina, limite);
  }

  async obtenerPorId(id: number, usuarioAuth: any) {
    return await this.obtenerProyectoConAcceso(id, usuarioAuth);
  }

  async crear(data: CrearProyectoColaborativoDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.AULA_COLABORATIVA_CREAR);

    const institucionId = tieneAccesoTotal(usuarioAuth)
      ? Number(data.institucionId || usuarioAuth?.institucionId)
      : Number(usuarioAuth?.institucionId);

    if (!institucionId) {
      throw new BadRequestException('Debe indicar una institución válida');
    }

    const integrantes = data.integrantes.map((integrante) => ({
      usuarioId: Number(integrante.usuarioId),
      rolProyecto: this.validarRolProyecto(integrante.rolProyecto),
    }));
    const usuarioIds = Array.from(
      new Set(integrantes.map((integrante) => integrante.usuarioId)),
    );

    if (usuarioIds.length !== integrantes.length) {
      throw new BadRequestException('No puede repetir integrantes');
    }

    if (!integrantes.some((integrante) => integrante.rolProyecto === 'lider')) {
      throw new BadRequestException('Debe asignar al menos un líder');
    }

    await this.validarEstudiantesInstitucion(usuarioIds, institucionId);

    if (data.categoriaId) {
      const categoria = await this.prisma.categoria.findFirst({
        where: {
          id: Number(data.categoriaId),
          institucionId,
          estado: true,
        },
      });

      if (!categoria) {
        throw new BadRequestException('Debe indicar una categoría válida');
      }
    }

    return await this.prisma.proyectoColaborativo.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        objetivo: data.objetivo,
        curso: data.curso,
        instrucciones: data.instrucciones,
        fechaLimite: new Date(data.fechaLimite),
        institucionId,
        docenteId: Number(usuarioAuth?.sub),
        gradoEscolarId: data.gradoEscolarId,
        categoriaId: data.categoriaId,
        integrantes: {
          create: integrantes,
        },
      },
      include: this.includeProyectoDetalle,
    });
  }

  async crearActividad(
    proyectoId: number,
    data: CrearActividadColaborativaDto,
    usuarioAuth: any,
  ) {
    if (
      !tienePermiso(usuarioAuth, PERMISOS.AULA_COLABORATIVA_GESTIONAR) &&
      !tienePermiso(usuarioAuth, PERMISOS.AULA_COLABORATIVA_PARTICIPAR)
    ) {
      throw new ForbiddenException('No tiene permisos para crear actividades');
    }
    const proyecto = await this.obtenerProyectoConAcceso(
      proyectoId,
      usuarioAuth,
    );
    this.validarProyectoEditable(proyecto);
    this.validarSinEntregaPendiente(proyecto);
    this.validarGestionProyecto(proyecto, usuarioAuth, true);

    if (
      data.responsableId &&
      !this.usuarioEsIntegrante(proyecto, Number(data.responsableId))
    ) {
      throw new BadRequestException(
        'El responsable debe ser integrante del proyecto',
      );
    }

    await this.prisma.proyectoColaborativoActividad.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        fechaLimite: data.fechaLimite ? new Date(data.fechaLimite) : undefined,
        proyectoId,
        responsableId: data.responsableId,
        creadorId: Number(usuarioAuth?.sub),
      },
    });

    return await this.obtenerProyectoConAcceso(proyectoId, usuarioAuth);
  }

  async actualizarEstadoActividad(
    proyectoId: number,
    actividadId: number,
    data: ActualizarEstadoActividadDto,
    usuarioAuth: any,
  ) {
    validarPermiso(usuarioAuth, PERMISOS.AULA_COLABORATIVA_PARTICIPAR);
    const proyecto = await this.obtenerProyectoConAcceso(
      proyectoId,
      usuarioAuth,
    );
    this.validarProyectoEditable(proyecto);
    this.validarSinEntregaPendiente(proyecto);
    const actividad = proyecto.actividades.find(
      (item) => item.id === actividadId,
    );

    if (!actividad) {
      throw new NotFoundException('Actividad no encontrada');
    }

    const usuarioId = Number(usuarioAuth?.sub);
    const puedeCambiar =
      this.esAdministradorInstitucional(usuarioAuth) ||
      proyecto.docenteId === usuarioId ||
      actividad.responsableId === usuarioId ||
      this.usuarioEsLider(proyecto, usuarioId);

    if (!puedeCambiar) {
      throw new ForbiddenException('No puede cambiar esta actividad');
    }

    const estadoSolicitado = this.validarEstadoActividad(data.estado);

    if (estadoSolicitado === actividad.estado) {
      return await this.obtenerProyectoConAcceso(proyectoId, usuarioAuth);
    }

    if (
      estadoSolicitado === 'en_revision' &&
      (actividad.evidencias || []).length === 0
    ) {
      throw new BadRequestException(
        'Debe subir al menos una evidencia antes de enviar la actividad a revisión',
      );
    }

    if (estadoSolicitado === 'completada') {
      if (actividad.estado !== 'en_revision') {
        throw new BadRequestException(
          'Solo puede completar una actividad que esté en revisión',
        );
      }

      if (
        !this.usuarioEsLider(proyecto, usuarioId) &&
        !tieneAccesoTotal(usuarioAuth)
      ) {
        throw new ForbiddenException(
          'Solo el líder del proyecto puede marcar actividades como completadas',
        );
      }
    }

    await this.prisma.proyectoColaborativoActividad.update({
      where: { id: actividadId },
      data: { estado: estadoSolicitado },
    });

    return await this.obtenerProyectoConAcceso(proyectoId, usuarioAuth);
  }

  async subirEvidencia(
    proyectoId: number,
    actividadId: number,
    data: SubirEvidenciaDto,
    file: Express.Multer.File,
    usuarioAuth: any,
  ) {
    validarPermiso(usuarioAuth, PERMISOS.AULA_COLABORATIVA_PARTICIPAR);

    if (!file) {
      throw new BadRequestException('Debe enviar un archivo de evidencia');
    }

    const proyecto = await this.obtenerProyectoConAcceso(
      proyectoId,
      usuarioAuth,
    );
    this.validarProyectoEditable(proyecto);
    this.validarSinEntregaPendiente(proyecto);
    this.validarParticipacionProyecto(proyecto, usuarioAuth);
    const actividad = proyecto.actividades.find(
      (item) => item.id === actividadId,
    );

    if (!actividad) {
      throw new NotFoundException('Actividad no encontrada');
    }

    await this.prisma.proyectoColaborativoEvidencia.create({
      data: {
        comentario: data.comentario,
        rutaArchivo: `/uploads/aula-colaborativa/${file.filename}`,
        nombreArchivo: file.originalname,
        mimeType: file.mimetype,
        actividadId,
        usuarioId: Number(usuarioAuth?.sub),
      },
    });

    return await this.obtenerProyectoConAcceso(proyectoId, usuarioAuth);
  }

  async crearEntrega(
    proyectoId: number,
    data: CrearEntregaColaborativaDto,
    file: Express.Multer.File,
    usuarioAuth: any,
  ) {
    validarPermiso(usuarioAuth, PERMISOS.AULA_COLABORATIVA_PARTICIPAR);

    if (!file) {
      throw new BadRequestException('Debe enviar el documento de entrega');
    }

    const proyecto = await this.obtenerProyectoConAcceso(
      proyectoId,
      usuarioAuth,
    );
    this.validarProyectoEditable(proyecto);
    this.validarSinEntregaPendiente(proyecto);
    this.validarParticipacionProyecto(proyecto, usuarioAuth);

    await this.prisma.$transaction(async (tx) => {
      await tx.proyectoColaborativoEntrega.create({
        data: {
          comentario: data.comentario,
          rutaArchivo: `/uploads/aula-colaborativa/${file.filename}`,
          nombreArchivo: file.originalname,
          mimeType: file.mimetype,
          proyectoId,
          usuarioId: Number(usuarioAuth?.sub),
        },
      });

      await tx.proyectoColaborativo.update({
        where: { id: proyectoId },
        data: { estado: 'en_revision' },
      });
    });

    return await this.obtenerProyectoConAcceso(proyectoId, usuarioAuth);
  }

  async revisarEntrega(
    proyectoId: number,
    entregaId: number,
    data: RevisarEntregaColaborativaDto,
    usuarioAuth: any,
  ) {
    validarPermiso(usuarioAuth, PERMISOS.AULA_COLABORATIVA_REVISAR);
    const proyecto = await this.obtenerProyectoConAcceso(
      proyectoId,
      usuarioAuth,
    );
    this.validarGestionProyecto(proyecto, usuarioAuth);
    const entrega = proyecto.entregas.find((item) => item.id === entregaId);

    if (!entrega) {
      throw new NotFoundException('Entrega no encontrada');
    }

    if (entrega.estado !== 'entregada' || entrega.fechaRevision) {
      throw new BadRequestException('Esta entrega ya fue revisada');
    }

    const estado = data.estado;
    let recursoId = entrega.recursoId || undefined;

    if (
      estado === 'aprobada' &&
      (data.calificacion === undefined ||
        data.calificacion === null ||
        !data.comentariosDocente?.trim())
    ) {
      throw new BadRequestException(
        'Para aprobar el proyecto debe registrar calificación y comentarios',
      );
    }

    if (estado === 'aprobada' && !recursoId) {
      const recurso = await this.recursoService.crearDesdeAulaColaborativa(
        {
          titulo: `Proyecto colaborativo: ${proyecto.titulo}`,
          contenidoResumen: [
            proyecto.objetivo,
            proyecto.descripcion,
            data.comentariosDocente,
            entrega.comentario,
          ]
            .filter(Boolean)
            .join('\n\n'),
          rutaRecurso: entrega.rutaArchivo,
          fuente: `Aula Colaborativa: ${proyecto.titulo}`,
          autorNombre: `Grupo colaborativo - ${proyecto.titulo}`,
          nivelAcademico: proyecto.gradoEscolar?.nombre,
          gradoEscolarId: proyecto.gradoEscolarId || undefined,
          publicado: true,
          institucionId: proyecto.institucionId,
          categoriaId: proyecto.categoriaId || undefined,
          usuarioCreadorId: entrega.usuarioId,
        },
        {
          ...usuarioAuth,
          institucionId: proyecto.institucionId,
        },
      );
      recursoId = recurso.id;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.proyectoColaborativoEntrega.update({
        where: { id: entregaId },
        data: {
          estado,
          calificacion: data.calificacion,
          comentariosDocente: data.comentariosDocente,
          fechaRevision: new Date(),
          recursoId,
        },
      });

      await tx.proyectoColaborativo.update({
        where: { id: proyectoId },
        data: {
          estado:
            estado === 'aprobada'
              ? 'aprobado'
              : estado === 'requiere_ajustes'
                ? 'requiere_ajustes'
                : 'activo',
          calificacion: data.calificacion,
          comentariosCierre: data.comentariosDocente,
          fechaCierre: estado === 'aprobada' ? new Date() : undefined,
        },
      });
    });

    return await this.obtenerProyectoConAcceso(proyectoId, usuarioAuth);
  }
}
