import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearForoDto } from '../dto/crear-foro.dto';
import { ActualizarForoDto } from '../dto/actualizar-foro.dto';
import { CrearComentarioForoDto } from '../dto/crear-comentario-foro.dto';
import { SubirRecursoForoDto } from '../dto/subir-recurso-foro.dto';
import { ComentarRecursoForoDto } from '../dto/comentar-recurso-foro.dto';
import { ComentarRecursoExistenteForoDto } from '../dto/comentar-recurso-existente-foro.dto';
import {
  PERMISOS,
  tieneAccesoTotal,
  tienePermiso,
  validarAlcanceInstitucional,
  validarPermiso,
} from '../../auth/utils/roles.util';
import {
  ConsultaPaginada,
  obtenerPaginacion,
  respuestaPaginada,
  valorBooleano,
} from '../../../comun/paginacion';

@Injectable()
export class ForoService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly limitePalabrasClave = 6;

  private readonly includeRecursoForo = {
    categoria: {
      select: {
        id: true,
        nombre: true,
      },
    },
    tipoRecurso: {
      select: {
        id: true,
        nombre: true,
      },
    },
    usuarioCreador: {
      select: {
        id: true,
        nombres: true,
        apellidos: true,
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
    comentarioForo: {
      select: {
        id: true,
        contenido: true,
      },
    },
  };

  private includeForoDetalle = {
    institucion: {
      select: {
        id: true,
        nombre: true,
      },
    },
    categoria: {
      select: {
        id: true,
        nombre: true,
        color: true,
      },
    },
    categorias: {
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
            color: true,
          },
        },
      },
    },
    usuario: {
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        rol: {
          select: {
            nombre: true,
          },
        },
        institucion: {
          select: {
            id: true,
            nombre: true,
          },
        },
        recursos: {
          where: {
            estado: true,
          },
          orderBy: {
            createdAt: 'asc' as const,
          },
          include: this.includeRecursoForo,
        },
      },
    },
    comentarios: {
      where: {
        estado: true,
      },
      orderBy: {
        createdAt: 'asc' as const,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            rol: {
              select: {
                nombre: true,
              },
            },
            institucion: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        recursos: {
          where: {
            estado: true,
          },
          orderBy: {
            createdAt: 'asc' as const,
          },
          include: this.includeRecursoForo,
        },
        recursosCompartidos: {
          orderBy: {
            createdAt: 'asc' as const,
          },
          include: {
            recurso: {
              include: this.includeRecursoForo,
            },
          },
        },
      },
    },
    recursos: {
      where: {
        estado: true,
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
      include: this.includeRecursoForo,
    },
  };

  private includeComentarioForoDetalle = {
    usuario: {
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        rol: {
          select: {
            nombre: true,
          },
        },
        institucion: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    },
    recursos: {
      where: {
        estado: true,
      },
      orderBy: {
        createdAt: 'asc' as const,
      },
      include: this.includeRecursoForo,
    },
    recursosCompartidos: {
      orderBy: {
        createdAt: 'asc' as const,
      },
      include: {
        recurso: {
          include: this.includeRecursoForo,
        },
      },
    },
  };

  private combinarRecursosComentario(comentario: any) {
    const recursosDirectos = comentario?.recursos || [];
    const recursosCompartidos = (comentario?.recursosCompartidos || [])
      .map((item: any) => item.recurso)
      .filter(Boolean);
    const recursosPorId = new Map<number, any>();

    [...recursosDirectos, ...recursosCompartidos].forEach((recurso) => {
      if (recurso?.id && recurso.estado !== false) {
        recursosPorId.set(recurso.id, recurso);
      }
    });

    return {
      ...comentario,
      recursos: Array.from(recursosPorId.values()),
    };
  }

  private normalizarComentarioRespuesta(comentario: any) {
    return this.combinarRecursosComentario(comentario);
  }

  private normalizarForoRespuesta(foro: any) {
    if (!foro) {
      return foro;
    }

    const comentarios = (foro.comentarios || []).map((comentario: any) =>
      this.combinarRecursosComentario(comentario),
    );
    const recursosPorId = new Map<number, any>();

    (foro.recursos || []).forEach((recurso: any) => {
      if (recurso?.id && recurso.estado !== false) {
        recursosPorId.set(recurso.id, recurso);
      }
    });

    comentarios.forEach((comentario: any) => {
      (comentario.recursos || []).forEach((recurso: any) => {
        if (recurso?.id && recurso.estado !== false) {
          recursosPorId.set(recurso.id, recurso);
        }
      });
    });

    return {
      ...foro,
      comentarios,
      recursos: Array.from(recursosPorId.values()).sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      ),
    };
  }

  private normalizarTexto(valor?: string | null) {
    return (valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private extraerPalabrasClave(textos: Array<string | undefined | null>) {
    const palabrasIgnoradas = new Set([
      'academico',
      'academica',
      'archivo',
      'como',
      'con',
      'del',
      'desde',
      'documento',
      'este',
      'esta',
      'foro',
      'para',
      'por',
      'que',
      'recurso',
      'sobre',
      'una',
      'uno',
      'los',
      'las',
      'sin',
      'sus',
      'tema',
    ]);
    const contador = new Map<string, number>();
    const texto = this.normalizarTexto(textos.filter(Boolean).join(' '))
      .replace(/[^a-z0-9ñ\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    texto.split(' ').forEach((palabra) => {
      if (palabra.length < 4 || palabrasIgnoradas.has(palabra)) {
        return;
      }

      contador.set(palabra, (contador.get(palabra) || 0) + 1);
    });

    return Array.from(contador.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, this.limitePalabrasClave)
      .map(([palabra]) => palabra);
  }

  private construirTituloArchivo(
    titulo: string | undefined,
    file: Express.Multer.File,
  ) {
    const tituloLimpio = titulo?.trim();

    if (tituloLimpio) {
      return tituloLimpio;
    }

    return file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private valorBooleanoFormulario(
    valor: string | boolean | undefined,
    predeterminado: boolean,
  ) {
    if (valor === undefined || valor === null || valor === '') {
      return predeterminado;
    }

    if (typeof valor === 'boolean') {
      return valor;
    }

    return ['true', '1', 'si', 'sí', 'on', 'publicado'].includes(
      this.normalizarTexto(valor),
    );
  }

  private numeroPositivo(valor: string | number | undefined) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : null;
  }

  private normalizarCategoriaIds(data: {
    categoriaId?: number;
    categoriaIds?: Array<number | string>;
  }) {
    const ids = data.categoriaIds?.length
      ? data.categoriaIds
      : data.categoriaId
        ? [data.categoriaId]
        : [];

    return Array.from(
      new Set(
        ids
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );
  }

  private obtenerCategoriaIdsForo(foro: any) {
    const categoriaIds = (foro.categorias || [])
      .map((item) => Number(item.categoriaId || item.categoria?.id))
      .filter((id) => Number.isInteger(id) && id > 0);

    return categoriaIds.length > 0 ? categoriaIds : [Number(foro.categoriaId)];
  }

  private obtenerNombresCategoriasForo(foro: any) {
    const nombres = (foro.categorias || [])
      .map((item) => item.categoria?.nombre)
      .filter(Boolean);

    return nombres.length > 0 ? nombres.join(' ') : foro.categoria?.nombre;
  }

  private async validarCategoriasForo(
    categoriaIds: number[],
    institucionId: number,
    usuarioAuth: any,
  ) {
    if (categoriaIds.length === 0) {
      throw new BadRequestException(
        'Debe indicar al menos una categoría válida',
      );
    }

    const categorias = await this.prisma.categoria.findMany({
      where: {
        id: {
          in: categoriaIds,
        },
        estado: true,
      },
    });

    if (categorias.length !== categoriaIds.length) {
      throw new BadRequestException('Una o más categorías no son válidas');
    }

    const categoriaFueraInstitucion = categorias.find(
      (categoria) => categoria.institucionId !== institucionId,
    );

    if (categoriaFueraInstitucion) {
      if (tieneAccesoTotal(usuarioAuth)) {
        throw new BadRequestException(
          'Todas las categorías deben pertenecer a la institución seleccionada',
        );
      }

      throw new ForbiddenException(
        'No puede usar categorías de otra institución',
      );
    }

    return categoriaIds
      .map((id) => categorias.find((categoria) => categoria.id === id))
      .filter(Boolean) as typeof categorias;
  }

  private async resolverGradoEscolar(
    gradoEscolarId: string | number | undefined,
    textos: Array<string | undefined | null>,
  ) {
    const idSolicitado = this.numeroPositivo(gradoEscolarId);

    if (idSolicitado) {
      const grado = await this.prisma.gradoEscolar.findFirst({
        where: {
          id: idSolicitado,
          estado: true,
        },
      });

      if (!grado) {
        throw new BadRequestException('Debe indicar un grado escolar válido');
      }

      return grado;
    }

    const grados = await this.prisma.gradoEscolar.findMany({
      where: {
        estado: true,
      },
      orderBy: {
        orden: 'asc',
      },
    });
    const texto = this.normalizarTexto(textos.join(' '));

    return (
      grados.find((grado) => {
        const nombre = this.normalizarTexto(grado.nombre);
        const codigo = this.normalizarTexto(grado.codigo);
        const orden = String(grado.orden);
        const alias = [
          nombre,
          codigo,
          orden,
          `${orden} grado`,
          `grado ${orden}`,
          `grado ${nombre}`,
          `${nombre} grado`,
        ];

        return alias.some((item) => texto.includes(item));
      }) || null
    );
  }

  private async clasificarCategoria(
    foro: any,
    institucionId: number,
    palabrasClave: string[],
  ) {
    const categorias = await this.prisma.categoria.findMany({
      where: {
        estado: true,
        institucionId,
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
      },
    });

    if (categorias.length === 0) {
      throw new BadRequestException(
        'Debe existir al menos una categoría activa para clasificar el recurso',
      );
    }

    const categoriaIdsForo = this.obtenerCategoriaIdsForo(foro);
    const categoriaForo =
      categorias.find((categoria) => categoriaIdsForo.includes(categoria.id)) ||
      categorias[0];

    return categorias.reduce(
      (mejor, categoria) => {
        const textoCategoria = this.normalizarTexto(
          `${categoria.nombre} ${categoria.descripcion}`,
        );
        const puntaje =
          (categoriaIdsForo.includes(categoria.id) ? 2 : 0) +
          palabrasClave.reduce(
            (total, palabra) =>
              textoCategoria.includes(palabra) ? total + 2 : total,
            0,
          );

        return puntaje > mejor.puntaje ? { categoria, puntaje } : mejor;
      },
      { categoria: categoriaForo, puntaje: 0 },
    ).categoria;
  }

  private async clasificarTipoRecurso(file: Express.Multer.File) {
    const tipos = await this.prisma.tipoRecurso.findMany({
      where: {
        estado: true,
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
      },
    });

    if (tipos.length === 0) {
      throw new BadRequestException(
        'Debe existir al menos un tipo de recurso activo para clasificar el archivo',
      );
    }

    const extension = file.originalname.split('.').pop()?.toLowerCase() || '';
    const pistasPorExtension: Record<string, string[]> = {
      pdf: ['pdf', 'documento', 'lectura', 'guia', 'guía'],
      doc: ['word', 'documento', 'texto', 'guia', 'guía'],
      docx: ['word', 'documento', 'texto', 'guia', 'guía'],
      ppt: ['powerpoint', 'presentacion', 'diapositiva', 'slide'],
      pptx: ['powerpoint', 'presentacion', 'diapositiva', 'slide'],
      png: ['imagen', 'infografia', 'grafico', 'visual'],
      jpg: ['imagen', 'foto', 'grafico', 'visual'],
      jpeg: ['imagen', 'foto', 'grafico', 'visual'],
      webp: ['imagen', 'foto', 'grafico', 'visual'],
      mp4: ['video', 'multimedia', 'clase'],
      webm: ['video', 'multimedia', 'clase'],
    };
    const pistas = (pistasPorExtension[extension] || [extension]).map((item) =>
      this.normalizarTexto(item),
    );

    return tipos.reduce(
      (mejor, tipo) => {
        const textoTipo = this.normalizarTexto(
          `${tipo.nombre} ${tipo.descripcion || ''}`,
        );
        const puntaje = pistas.reduce(
          (total, pista) => (textoTipo.includes(pista) ? total + 2 : total),
          textoTipo.includes(extension) ? 1 : 0,
        );

        return puntaje > mejor.puntaje ? { tipo, puntaje } : mejor;
      },
      { tipo: tipos[0], puntaje: -1 },
    ).tipo;
  }

  private construirFiltroAlcance(usuarioAuth: any) {
    if (tieneAccesoTotal(usuarioAuth)) {
      return {};
    }

    return {
      OR: [
        { publico: true },
        { institucionId: Number(usuarioAuth?.institucionId) },
      ],
    };
  }

  private construirFiltroForos(
    usuarioAuth: any,
    query: ConsultaPaginada,
    soloActivos: boolean,
    busqueda?: string,
  ): Prisma.ForoWhereInput {
    const condiciones: Prisma.ForoWhereInput[] = [
      this.construirFiltroAlcance(usuarioAuth),
    ];

    if (soloActivos) {
      condiciones.push({ estado: true });
    } else {
      const estado = valorBooleano(query.estado);
      if (estado !== undefined) {
        condiciones.push({ estado });
      }
    }

    const publico = valorBooleano(query.publico);
    if (publico !== undefined) {
      condiciones.push({ publico });
    }

    const cerrado = valorBooleano(query.cerrado);
    if (cerrado !== undefined) {
      condiciones.push({ cerrado });
    }

    if (query.categoriaId) {
      condiciones.push({
        OR: [
          { categoriaId: Number(query.categoriaId) },
          {
            categorias: {
              some: {
                categoriaId: Number(query.categoriaId),
              },
            },
          },
        ],
      });
    }

    if (query.institucionId && tieneAccesoTotal(usuarioAuth)) {
      condiciones.push({ institucionId: Number(query.institucionId) });
    }

    if (busqueda) {
      condiciones.push({
        OR: [
          { titulo: { contains: busqueda, mode: 'insensitive' } },
          { descripcion: { contains: busqueda, mode: 'insensitive' } },
        ],
      });
    }

    return { AND: condiciones };
  }

  async crear(data: CrearForoDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.FOROS_CREAR);

    const publico = Boolean(data.publico);

    if (publico && !tienePermiso(usuarioAuth, PERMISOS.FOROS_CREAR_PUBLICO)) {
      throw new ForbiddenException(
        'No tiene permisos para crear foros públicos',
      );
    }

    const institucionId = tieneAccesoTotal(usuarioAuth)
      ? Number(data.institucionId || usuarioAuth?.institucionId)
      : Number(usuarioAuth?.institucionId);

    if (!institucionId) {
      throw new BadRequestException('Debe indicar una institución válida');
    }

    const categoriaIds = this.normalizarCategoriaIds(data);
    const categorias = await this.validarCategoriasForo(
      categoriaIds,
      institucionId,
      usuarioAuth,
    );
    const categoriaPrincipal = categorias[0];

    const foro = await this.prisma.foro.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        publico,
        institucionId,
        categoriaId: categoriaPrincipal.id,
        usuarioId: Number(usuarioAuth?.sub),
        categorias: {
          create: categorias.map((categoria) => ({
            categoriaId: categoria.id,
          })),
        },
      },
      include: this.includeForoDetalle,
    });

    return this.normalizarForoRespuesta(foro);
  }

  async listar(usuarioAuth: any, query: ConsultaPaginada = {}) {
    validarPermiso(usuarioAuth, PERMISOS.FOROS_VER);
    const { pagina, limite, skip, busqueda } = obtenerPaginacion(query);
    const where = this.construirFiltroForos(usuarioAuth, query, true, busqueda);

    const [data, total] = await Promise.all([
      this.prisma.foro.findMany({
        where,
        orderBy: {
          id: 'desc',
        },
        include: this.includeForoDetalle,
        skip,
        take: limite,
      }),
      this.prisma.foro.count({ where }),
    ]);

    return respuestaPaginada(
      data.map((foro) => this.normalizarForoRespuesta(foro)),
      total,
      pagina,
      limite,
    );
  }

  async listarTodos(usuarioAuth: any, query: ConsultaPaginada = {}) {
    validarPermiso(usuarioAuth, PERMISOS.FOROS_VER);
    const { pagina, limite, skip, busqueda } = obtenerPaginacion(query);
    const where = this.construirFiltroForos(
      usuarioAuth,
      query,
      false,
      busqueda,
    );

    const [data, total] = await Promise.all([
      this.prisma.foro.findMany({
        where,
        orderBy: {
          id: 'desc',
        },
        include: this.includeForoDetalle,
        skip,
        take: limite,
      }),
      this.prisma.foro.count({ where }),
    ]);

    return respuestaPaginada(
      data.map((foro) => this.normalizarForoRespuesta(foro)),
      total,
      pagina,
      limite,
    );
  }

  async listarCategoriasParaForo(usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.FOROS_CREAR);

    return await this.prisma.categoria.findMany({
      where: {
        estado: true,
        ...(tieneAccesoTotal(usuarioAuth)
          ? {}
          : { institucionId: Number(usuarioAuth?.institucionId) }),
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async obtenerPorId(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.FOROS_VER);

    const foro = await this.prisma.foro.findUnique({
      where: { id },
      include: this.includeForoDetalle,
    });

    if (!foro) {
      throw new NotFoundException(`Foro con id ${id} no encontrado`);
    }

    if (!foro.publico) {
      validarAlcanceInstitucional(usuarioAuth, foro.institucionId);
    }

    return this.normalizarForoRespuesta(foro);
  }

  async actualizar(id: number, data: ActualizarForoDto, usuarioAuth: any) {
    const foro = await this.obtenerPorId(id, usuarioAuth);

    if (
      !tieneAccesoTotal(usuarioAuth) &&
      foro.usuarioId !== Number(usuarioAuth?.sub)
    ) {
      throw new ForbiddenException('Solo el creador puede editar este foro');
    }

    if (
      data.publico &&
      !tienePermiso(usuarioAuth, PERMISOS.FOROS_CREAR_PUBLICO)
    ) {
      throw new ForbiddenException(
        'No tiene permisos para publicar foros globales',
      );
    }

    const categoriaIds = this.normalizarCategoriaIds(data);
    const debeActualizarCategorias =
      categoriaIds.length > 0 ||
      data.categoriaId !== undefined ||
      data.categoriaIds !== undefined;
    const institucionId = Number(data.institucionId || foro.institucionId);
    const categorias = debeActualizarCategorias
      ? await this.validarCategoriasForo(
          categoriaIds,
          institucionId,
          usuarioAuth,
        )
      : [];
    const { categoriaIds: _categoriaIds, ...dataForo } = data;
    const payload = tieneAccesoTotal(usuarioAuth)
      ? dataForo
      : {
          ...dataForo,
          institucionId: undefined,
          usuarioId: undefined,
        };

    if (debeActualizarCategorias) {
      payload.categoriaId = categorias[0].id;
    }

    return await this.prisma.$transaction(async (tx) => {
      const foroActualizado = await tx.foro.update({
        where: { id },
        data: payload,
      });

      if (debeActualizarCategorias) {
        await tx.foroCategoria.deleteMany({
          where: {
            foroId: id,
          },
        });
        await tx.foroCategoria.createMany({
          data: categorias.map((categoria) => ({
            foroId: id,
            categoriaId: categoria.id,
          })),
          skipDuplicates: true,
        });
      }

      const foroActualizadoCompleto = await tx.foro.findUniqueOrThrow({
        where: {
          id: foroActualizado.id,
        },
        include: this.includeForoDetalle,
      });

      return this.normalizarForoRespuesta(foroActualizadoCompleto);
    });
  }

  async cerrar(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.FOROS_CERRAR);
    const foro = await this.obtenerPorId(id, usuarioAuth);

    if (
      !tieneAccesoTotal(usuarioAuth) &&
      foro.usuarioId !== Number(usuarioAuth?.sub)
    ) {
      throw new ForbiddenException('Solo el creador puede cerrar este foro');
    }

    const foroCerrado = await this.prisma.foro.update({
      where: { id },
      data: {
        cerrado: true,
        fechaCierre: new Date(),
      },
      include: this.includeForoDetalle,
    });

    return this.normalizarForoRespuesta(foroCerrado);
  }

  async inactivar(id: number, usuarioAuth: any) {
    const foro = await this.obtenerPorId(id, usuarioAuth);

    if (
      !tieneAccesoTotal(usuarioAuth) &&
      foro.usuarioId !== Number(usuarioAuth?.sub)
    ) {
      throw new ForbiddenException('Solo el creador puede inactivar este foro');
    }

    const foroInactivo = await this.prisma.foro.update({
      where: { id },
      data: {
        estado: false,
      },
      include: this.includeForoDetalle,
    });

    return this.normalizarForoRespuesta(foroInactivo);
  }

  async reactivar(id: number, usuarioAuth: any) {
    const foro = await this.obtenerPorId(id, usuarioAuth);

    if (
      !tieneAccesoTotal(usuarioAuth) &&
      foro.usuarioId !== Number(usuarioAuth?.sub)
    ) {
      throw new ForbiddenException('Solo el creador puede reactivar este foro');
    }

    const foroReactivo = await this.prisma.foro.update({
      where: { id },
      data: {
        estado: true,
      },
      include: this.includeForoDetalle,
    });

    return this.normalizarForoRespuesta(foroReactivo);
  }

  private async construirDatosRecursoDesdeForo(
    foro: any,
    opciones: {
      contexto: string;
      titulo?: string;
      gradoEscolarId?: string | number;
      publicado?: string | boolean;
    },
    file: Express.Multer.File,
    usuarioAuth: any,
  ) {
    const titulo = this.construirTituloArchivo(opciones.titulo, file);
    const textosClasificacion = [
      titulo,
      opciones.contexto,
      foro.titulo,
      foro.descripcion,
      foro.categoria?.nombre,
      this.obtenerNombresCategoriasForo(foro),
      file.originalname,
    ];
    const palabrasClave = this.extraerPalabrasClave(textosClasificacion);
    const institucionRecursoId = tieneAccesoTotal(usuarioAuth)
      ? foro.institucionId
      : Number(usuarioAuth?.institucionId || foro.institucionId);
    const [categoria, tipoRecurso, gradoEscolar, usuario] = await Promise.all([
      this.clasificarCategoria(foro, institucionRecursoId, palabrasClave),
      this.clasificarTipoRecurso(file),
      this.resolverGradoEscolar(opciones.gradoEscolarId, textosClasificacion),
      this.prisma.usuario.findUnique({
        where: {
          id: Number(usuarioAuth?.sub),
        },
        select: {
          nombres: true,
          apellidos: true,
        },
      }),
    ]);

    return {
      data: {
        titulo,
        palabrasClave: palabrasClave.join(', '),
        contenidoResumen: opciones.contexto,
        rutaRecurso: `/uploads/recursos/${file.filename}`,
        fuente: `Foro académico: ${foro.titulo}`,
        autorNombre: usuario
          ? `${usuario.nombres} ${usuario.apellidos}`.trim()
          : undefined,
        nivelAcademico: gradoEscolar?.nombre,
        publicado: this.valorBooleanoFormulario(opciones.publicado, true),
        institucionId: institucionRecursoId,
        categoriaId: categoria.id,
        tipoRecursoId: tipoRecurso.id,
        usuarioCreadorId: Number(usuarioAuth?.sub),
        gradoEscolarId: gradoEscolar?.id,
        foroOrigenId: foro.id,
      },
      clasificacion: {
        categoria: categoria.nombre,
        tipoRecurso: tipoRecurso.nombre,
        gradoEscolar: gradoEscolar?.nombre || 'Sin grado específico',
        palabrasClave,
      },
    };
  }

  private validarForoAbiertoParaAportes(foro: any, mensajeCerrado: string) {
    if (!foro.estado) {
      throw new BadRequestException(
        'No se pueden agregar aportes a un foro inactivo',
      );
    }

    if (foro.cerrado) {
      throw new BadRequestException(mensajeCerrado);
    }
  }

  private async obtenerRecursoDisponibleParaForo(
    recursoId: number,
    usuarioAuth: any,
  ) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_VER);

    const recurso = await this.prisma.recurso.findFirst({
      where: {
        id: recursoId,
        estado: true,
        publicado: true,
      },
      include: this.includeRecursoForo,
    });

    if (!recurso) {
      throw new NotFoundException(`Recurso con id ${recursoId} no encontrado`);
    }

    if (
      !tieneAccesoTotal(usuarioAuth) &&
      recurso.institucionId !== Number(usuarioAuth?.institucionId)
    ) {
      throw new ForbiddenException(
        'No puede usar recursos de otra institución como soporte',
      );
    }

    if (
      !tienePermiso(usuarioAuth, PERMISOS.RECURSOS_VER_TODOS_GRADOS) &&
      recurso.gradoEscolarId &&
      recurso.gradoEscolarId !== Number(usuarioAuth?.gradoEscolarId)
    ) {
      throw new ForbiddenException(
        'No puede usar recursos de otro grado escolar como soporte',
      );
    }

    return recurso;
  }

  async subirRecursoDesdeForo(
    foroId: number,
    data: SubirRecursoForoDto,
    file: Express.Multer.File,
    usuarioAuth: any,
  ) {
    validarPermiso(usuarioAuth, PERMISOS.FOROS_SUBIR_RECURSO);
    validarPermiso(usuarioAuth, PERMISOS.FOROS_COMENTAR);

    if (!file) {
      throw new BadRequestException('Debe enviar un archivo');
    }

    const contexto = data.contexto?.trim();

    if (!contexto) {
      throw new BadRequestException(
        'Debe indicar el contexto académico del recurso',
      );
    }

    const foro = await this.obtenerPorId(foroId, usuarioAuth);
    this.validarForoAbiertoParaAportes(
      foro,
      'Este foro ya está cerrado para nuevos aportes',
    );

    const recursoClasificado = await this.construirDatosRecursoDesdeForo(
      foro,
      {
        contexto,
        titulo: data.titulo,
        gradoEscolarId: data.gradoEscolarId,
        publicado: data.publicado,
      },
      file,
      usuarioAuth,
    );
    const recurso = await this.prisma.$transaction(async (tx) => {
      const comentario = await tx.comentarioForo.create({
        data: {
          contenido: contexto,
          foroId,
          usuarioId: Number(usuarioAuth?.sub),
        },
      });

      return await tx.recurso.create({
        data: {
          ...recursoClasificado.data,
          comentarioForoId: comentario.id,
        },
        include: this.includeRecursoForo,
      });
    });

    return {
      mensaje: 'Archivo guardado como recurso y clasificado automáticamente',
      recurso,
      clasificacion: recursoClasificado.clasificacion,
    };
  }

  async comentarConRecurso(
    foroId: number,
    data: ComentarRecursoForoDto,
    file: Express.Multer.File,
    usuarioAuth: any,
  ) {
    validarPermiso(usuarioAuth, PERMISOS.FOROS_COMENTAR);
    validarPermiso(usuarioAuth, PERMISOS.FOROS_SUBIR_RECURSO);

    if (!file) {
      throw new BadRequestException('Debe enviar un archivo');
    }

    const contenido = data.contenido?.trim();

    if (!contenido) {
      throw new BadRequestException('Debe escribir el comentario del foro');
    }

    const foro = await this.obtenerPorId(foroId, usuarioAuth);
    this.validarForoAbiertoParaAportes(
      foro,
      'Este foro ya está cerrado para nuevos comentarios',
    );

    const recursoClasificado = await this.construirDatosRecursoDesdeForo(
      foro,
      {
        contexto: contenido,
        titulo: data.titulo,
        gradoEscolarId: data.gradoEscolarId,
        publicado: true,
      },
      file,
      usuarioAuth,
    );

    return await this.prisma.$transaction(async (tx) => {
      const comentario = await tx.comentarioForo.create({
        data: {
          contenido,
          foroId,
          usuarioId: Number(usuarioAuth?.sub),
        },
      });

      await tx.recurso.create({
        data: {
          ...recursoClasificado.data,
          comentarioForoId: comentario.id,
        },
      });

      const comentarioCompleto = await tx.comentarioForo.findUniqueOrThrow({
        where: {
          id: comentario.id,
        },
        include: this.includeComentarioForoDetalle,
      });

      return this.normalizarComentarioRespuesta(comentarioCompleto);
    });
  }

  async comentarConRecursoExistente(
    foroId: number,
    data: ComentarRecursoExistenteForoDto,
    usuarioAuth: any,
  ) {
    validarPermiso(usuarioAuth, PERMISOS.FOROS_COMENTAR);

    const contenido = data.contenido?.trim();

    if (!contenido) {
      throw new BadRequestException('Debe escribir el comentario del foro');
    }

    const foro = await this.obtenerPorId(foroId, usuarioAuth);
    this.validarForoAbiertoParaAportes(
      foro,
      'Este foro ya está cerrado para nuevos comentarios',
    );

    const recurso = await this.obtenerRecursoDisponibleParaForo(
      Number(data.recursoId),
      usuarioAuth,
    );

    return await this.prisma.$transaction(async (tx) => {
      const comentario = await tx.comentarioForo.create({
        data: {
          contenido,
          foroId,
          usuarioId: Number(usuarioAuth?.sub),
        },
      });

      await tx.comentarioForoRecurso.create({
        data: {
          comentarioForoId: comentario.id,
          recursoId: recurso.id,
        },
      });

      const comentarioCompleto = await tx.comentarioForo.findUniqueOrThrow({
        where: {
          id: comentario.id,
        },
        include: this.includeComentarioForoDetalle,
      });

      return this.normalizarComentarioRespuesta(comentarioCompleto);
    });
  }

  async comentar(
    foroId: number,
    data: CrearComentarioForoDto,
    usuarioAuth: any,
  ) {
    validarPermiso(usuarioAuth, PERMISOS.FOROS_COMENTAR);
    const foro = await this.obtenerPorId(foroId, usuarioAuth);

    if (!foro.estado) {
      throw new BadRequestException('No se puede comentar un foro inactivo');
    }

    if (foro.cerrado) {
      throw new BadRequestException(
        'Este foro ya está cerrado para comentarios',
      );
    }

    const comentario = await this.prisma.comentarioForo.create({
      data: {
        contenido: data.contenido,
        foroId,
        usuarioId: Number(usuarioAuth?.sub),
      },
      include: this.includeComentarioForoDetalle,
    });

    return this.normalizarComentarioRespuesta(comentario);
  }
}
