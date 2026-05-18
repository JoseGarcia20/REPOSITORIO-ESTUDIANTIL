import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearRecursoDto } from '../dto/crear-recurso.dto';
import { ActualizarRecursoDto } from '../dto/actualizar-recurso.dto';
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
export class RecursoService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly limitePalabrasClave = 6;

  private readonly includeRecursoDetalle = {
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
    foroOrigen: {
      select: {
        id: true,
        titulo: true,
        publico: true,
      },
    },
    comentarioForo: {
      select: {
        id: true,
        contenido: true,
      },
    },
  };

  private normalizarTexto(valor?: string | null) {
    return (valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private numeroPositivo(valor: string | number | undefined | null) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : null;
  }

  private obtenerExtension(data: CrearRecursoDto | ActualizarRecursoDto) {
    const origen = data.rutaRecurso || data.urlRecurso || '';
    const limpio = origen.split('?')[0].split('#')[0];
    const extension = limpio.split('.').pop()?.toLowerCase();

    return extension && extension !== limpio ? extension : '';
  }

  private extraerPalabrasClave(textos: Array<string | undefined | null>) {
    const palabrasIgnoradas = new Set([
      'academico',
      'academica',
      'archivo',
      'clase',
      'como',
      'con',
      'del',
      'desde',
      'documento',
      'educativo',
      'educativa',
      'este',
      'esta',
      'material',
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

  private unirPalabrasClave(
    palabrasUsuario: string | undefined,
    palabrasAutomaticas: string[],
  ) {
    const resultado: string[] = [];
    const vistas = new Set<string>();

    [...(palabrasUsuario || '').split(','), ...palabrasAutomaticas].forEach(
      (palabra) => {
        const limpia = palabra.trim();
        const llave = this.normalizarTexto(limpia);

        if (!limpia || vistas.has(llave)) {
          return;
        }

        vistas.add(llave);
        resultado.push(limpia);
      },
    );

    return resultado.slice(0, this.limitePalabrasClave).join(', ');
  }

  private completarPalabrasClave(
    palabrasBase: string[],
    textos: Array<string | undefined | null>,
  ) {
    const resultado: string[] = [];
    const vistas = new Set<string>();
    const agregar = (valor?: string | null) => {
      const limpia = (valor || '').trim();
      const llave = this.normalizarTexto(limpia);

      if (!limpia || llave.length < 3 || vistas.has(llave)) {
        return;
      }

      vistas.add(llave);
      resultado.push(llave);
    };

    palabrasBase.forEach(agregar);

    textos.forEach((texto) => {
      this.normalizarTexto(texto)
        .replace(/[^a-z0-9ñ\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .forEach((palabra) => {
          if (resultado.length >= 5) {
            return;
          }

          agregar(palabra);
        });
    });

    ['aprendizaje', 'educacion', 'recurso'].forEach((palabra) => {
      if (resultado.length < 5) {
        agregar(palabra);
      }
    });

    return resultado.slice(0, this.limitePalabrasClave);
  }

  private construirTextosClasificacion(data: CrearRecursoDto) {
    return [
      data.titulo,
      data.palabrasClave,
      data.contenidoResumen,
      data.fuente,
      data.autorNombre,
      data.nivelAcademico,
      data.rutaRecurso,
      data.urlRecurso,
    ];
  }

  private async resolverCategoriaRecurso(
    data: CrearRecursoDto,
    institucionId: number,
    palabrasClave: string[],
  ) {
    const categoriaSolicitadaId = this.numeroPositivo(data.categoriaId);

    if (categoriaSolicitadaId) {
      const categoria = await this.prisma.categoria.findFirst({
        where: {
          id: categoriaSolicitadaId,
          estado: true,
          institucionId,
        },
      });

      if (!categoria) {
        throw new BadRequestException(
          'Debe indicar una categoría activa de la institución del recurso',
        );
      }

      return categoria;
    }

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

    const textoRecurso = this.normalizarTexto(
      this.construirTextosClasificacion(data).join(' '),
    );

    return categorias.reduce(
      (mejor, categoria) => {
        const textoCategoria = this.normalizarTexto(
          `${categoria.nombre} ${categoria.descripcion}`,
        );
        const puntaje =
          (textoRecurso.includes(this.normalizarTexto(categoria.nombre))
            ? 4
            : 0) +
          palabrasClave.reduce(
            (total, palabra) =>
              textoCategoria.includes(palabra) ? total + 2 : total,
            0,
          );

        return puntaje > mejor.puntaje ? { categoria, puntaje } : mejor;
      },
      { categoria: categorias[0], puntaje: -1 },
    ).categoria;
  }

  private async resolverTipoRecurso(data: CrearRecursoDto) {
    const tipoSolicitadoId = this.numeroPositivo(data.tipoRecursoId);

    if (tipoSolicitadoId) {
      const tipo = await this.prisma.tipoRecurso.findFirst({
        where: {
          id: tipoSolicitadoId,
          estado: true,
        },
      });

      if (!tipo) {
        throw new BadRequestException('Debe indicar un tipo de recurso activo');
      }

      return tipo;
    }

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
        'Debe existir al menos un tipo de recurso activo para clasificar el recurso',
      );
    }

    const extension = this.obtenerExtension(data);
    const textoRecurso = this.normalizarTexto(
      this.construirTextosClasificacion(data).join(' '),
    );
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
    const pistas = [
      ...(pistasPorExtension[extension] || []),
      data.urlRecurso ? 'enlace' : '',
      textoRecurso.includes('video') ? 'video' : '',
    ]
      .filter(Boolean)
      .map((item) => this.normalizarTexto(item));

    return tipos.reduce(
      (mejor, tipo) => {
        const textoTipo = this.normalizarTexto(
          `${tipo.nombre} ${tipo.descripcion || ''}`,
        );
        const puntaje =
          (extension && textoTipo.includes(extension) ? 1 : 0) +
          pistas.reduce(
            (total, pista) => (textoTipo.includes(pista) ? total + 2 : total),
            0,
          ) +
          (textoRecurso.includes(textoTipo) ? 1 : 0);

        return puntaje > mejor.puntaje ? { tipo, puntaje } : mejor;
      },
      { tipo: tipos[0], puntaje: -1 },
    ).tipo;
  }

  private async resolverGradoEscolarRecurso(data: CrearRecursoDto) {
    const gradoSolicitadoId = this.numeroPositivo(data.gradoEscolarId);

    if (gradoSolicitadoId) {
      const grado = await this.prisma.gradoEscolar.findFirst({
        where: {
          id: gradoSolicitadoId,
          estado: true,
        },
      });

      if (!grado) {
        throw new BadRequestException('Debe indicar un grado escolar activo');
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
    const texto = this.normalizarTexto(
      this.construirTextosClasificacion(data).join(' '),
    );

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

  private async construirPayloadClasificado(
    data: CrearRecursoDto,
    institucionId: number,
    usuarioAuth: any,
  ) {
    const palabrasAutomaticas = this.extraerPalabrasClave(
      this.construirTextosClasificacion(data),
    );
    const [categoria, tipoRecurso, gradoEscolar] = await Promise.all([
      this.resolverCategoriaRecurso(data, institucionId, palabrasAutomaticas),
      this.resolverTipoRecurso(data),
      this.resolverGradoEscolarRecurso(data),
    ]);
    const usuarioCreadorId =
      this.numeroPositivo(data.usuarioCreadorId) || Number(usuarioAuth?.sub);
    const usuarioCreador = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioCreadorId,
        activo: true,
        institucionId,
      },
      select: {
        id: true,
      },
    });

    if (!usuarioCreador) {
      throw new BadRequestException(
        'El usuario creador debe estar activo y pertenecer a la institución del recurso',
      );
    }
    const palabrasClave = this.completarPalabrasClave(palabrasAutomaticas, [
      data.titulo,
      data.contenidoResumen,
      data.fuente,
      data.autorNombre,
      data.nivelAcademico,
      data.rutaRecurso,
      data.urlRecurso,
      categoria.nombre,
      categoria.descripcion,
      tipoRecurso.nombre,
      tipoRecurso.descripcion,
      gradoEscolar?.nombre,
      gradoEscolar?.codigo,
      this.obtenerExtension(data),
    ]);

    return {
      palabrasClave: this.unirPalabrasClave(data.palabrasClave, palabrasClave),
      contenidoResumen:
        data.contenidoResumen?.trim() ||
        `Material educativo sobre ${data.titulo}.`,
      categoriaId: categoria.id,
      tipoRecursoId: tipoRecurso.id,
      gradoEscolarId: gradoEscolar?.id,
      nivelAcademico:
        gradoEscolar?.nombre || data.nivelAcademico?.trim() || undefined,
      usuarioCreadorId,
    };
  }

  private construirFiltroRecursos(
    usuarioAuth: any,
    query: ConsultaPaginada,
    soloActivos: boolean,
    busqueda?: string,
  ): Prisma.RecursoWhereInput {
    const esGlobal = tieneAccesoTotal(usuarioAuth);
    const condicionesAnd: Prisma.RecursoWhereInput[] = [];
    const where: Prisma.RecursoWhereInput = {
      ...(soloActivos ? { estado: true } : {}),
      ...(esGlobal
        ? {}
        : { institucionId: Number(usuarioAuth?.institucionId) }),
    };
    const puedeVerTodosLosGrados = tienePermiso(
      usuarioAuth,
      PERMISOS.RECURSOS_VER_TODOS_GRADOS,
    );

    if (!puedeVerTodosLosGrados) {
      where.gradoEscolarId = Number(usuarioAuth?.gradoEscolarId || -1);
    }

    const estado = valorBooleano(query.estado);
    if (!soloActivos && estado !== undefined) {
      where.estado = estado;
    }

    const publicado = valorBooleano(query.publicado);
    if (publicado !== undefined) {
      where.publicado = publicado;
    }

    if (esGlobal && query.institucionId) {
      where.institucionId = Number(query.institucionId);
    }

    if (query.categoriaId) {
      where.categoriaId = Number(query.categoriaId);
    }

    if (query.tipoRecursoId) {
      where.tipoRecursoId = Number(query.tipoRecursoId);
    }

    if (query.gradoEscolarId && puedeVerTodosLosGrados) {
      where.gradoEscolarId = Number(query.gradoEscolarId);
    }

    if (query.recursoId) {
      where.id = Number(query.recursoId);
    }

    if (query.tipoArchivo) {
      const filtrosArchivo: Record<string, Prisma.RecursoWhereInput[]> = {
        pdf: [
          { rutaRecurso: { endsWith: '.pdf', mode: 'insensitive' } },
          { urlRecurso: { endsWith: '.pdf', mode: 'insensitive' } },
        ],
        word: [
          { rutaRecurso: { endsWith: '.doc', mode: 'insensitive' } },
          { rutaRecurso: { endsWith: '.docx', mode: 'insensitive' } },
          { urlRecurso: { endsWith: '.doc', mode: 'insensitive' } },
          { urlRecurso: { endsWith: '.docx', mode: 'insensitive' } },
        ],
        slide: [
          { rutaRecurso: { endsWith: '.ppt', mode: 'insensitive' } },
          { rutaRecurso: { endsWith: '.pptx', mode: 'insensitive' } },
          { urlRecurso: { endsWith: '.ppt', mode: 'insensitive' } },
          { urlRecurso: { endsWith: '.pptx', mode: 'insensitive' } },
        ],
        image: [
          { rutaRecurso: { endsWith: '.png', mode: 'insensitive' } },
          { rutaRecurso: { endsWith: '.jpg', mode: 'insensitive' } },
          { rutaRecurso: { endsWith: '.jpeg', mode: 'insensitive' } },
          { rutaRecurso: { endsWith: '.webp', mode: 'insensitive' } },
          { urlRecurso: { endsWith: '.png', mode: 'insensitive' } },
          { urlRecurso: { endsWith: '.jpg', mode: 'insensitive' } },
          { urlRecurso: { endsWith: '.jpeg', mode: 'insensitive' } },
          { urlRecurso: { endsWith: '.webp', mode: 'insensitive' } },
        ],
        video: [
          { rutaRecurso: { endsWith: '.mp4', mode: 'insensitive' } },
          { rutaRecurso: { endsWith: '.webm', mode: 'insensitive' } },
          { urlRecurso: { endsWith: '.mp4', mode: 'insensitive' } },
          { urlRecurso: { endsWith: '.webm', mode: 'insensitive' } },
        ],
        link: [
          {
            urlRecurso: {
              not: null,
            },
          },
        ],
      };

      const filtros = filtrosArchivo[query.tipoArchivo];
      if (filtros) {
        condicionesAnd.push({ OR: filtros });
      }
    }

    if (busqueda) {
      condicionesAnd.push({
        OR: [
          { titulo: { contains: busqueda, mode: 'insensitive' } },
          { palabrasClave: { contains: busqueda, mode: 'insensitive' } },
          { contenidoResumen: { contains: busqueda, mode: 'insensitive' } },
          { fuente: { contains: busqueda, mode: 'insensitive' } },
          { autorNombre: { contains: busqueda, mode: 'insensitive' } },
          { nivelAcademico: { contains: busqueda, mode: 'insensitive' } },
          {
            gradoEscolar: {
              nombre: { contains: busqueda, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    if (condicionesAnd.length > 0) {
      where.AND = condicionesAnd;
    }

    return where;
  }

  private async crearClasificado(data: CrearRecursoDto, usuarioAuth: any) {
    try {
      const institucionId = tieneAccesoTotal(usuarioAuth)
        ? Number(data.institucionId)
        : Number(usuarioAuth?.institucionId);

      if (!institucionId) {
        throw new BadRequestException('Debe indicar una institución válida');
      }

      const clasificacion = await this.construirPayloadClasificado(
        data,
        institucionId,
        usuarioAuth,
      );

      return await this.prisma.recurso.create({
        data: {
          ...data,
          ...clasificacion,
          institucionId,
        },
        include: this.includeRecursoDetalle,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un recurso con ese dato único.');
      }

      throw error;
    }
  }

  async crear(data: CrearRecursoDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_CREAR);
    return await this.crearClasificado(data, usuarioAuth);
  }

  async crearDesdeAulaColaborativa(data: CrearRecursoDto, usuarioAuth: any) {
    return await this.crearClasificado(data, usuarioAuth);
  }

  async listar(usuarioAuth: any, query: ConsultaPaginada = {}) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_VER);
    const { pagina, limite, skip, busqueda } = obtenerPaginacion(query);
    const where = this.construirFiltroRecursos(
      usuarioAuth,
      query,
      true,
      busqueda,
    );

    const [data, total] = await Promise.all([
      this.prisma.recurso.findMany({
        where,
        include: this.includeRecursoDetalle,
        orderBy: { id: 'desc' },
        skip,
        take: limite,
      }),
      this.prisma.recurso.count({ where }),
    ]);

    return respuestaPaginada(data, total, pagina, limite);
  }

  async listarTodos(usuarioAuth: any, query: ConsultaPaginada = {}) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_VER);
    const { pagina, limite, skip, busqueda } = obtenerPaginacion(query);
    const where = this.construirFiltroRecursos(
      usuarioAuth,
      query,
      false,
      busqueda,
    );

    const [data, total] = await Promise.all([
      this.prisma.recurso.findMany({
        where,
        include: this.includeRecursoDetalle,
        orderBy: { id: 'desc' },
        skip,
        take: limite,
      }),
      this.prisma.recurso.count({ where }),
    ]);

    return respuestaPaginada(data, total, pagina, limite);
  }

  async obtenerPorId(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_VER);
    const recurso = await this.prisma.recurso.findUnique({
      where: { id },
      include: this.includeRecursoDetalle,
    });

    if (!recurso) {
      throw new NotFoundException(`Recurso con id ${id} no encontrado`);
    }

    validarAlcanceInstitucional(usuarioAuth, recurso.institucionId);
    return recurso;
  }

  async actualizar(id: number, data: ActualizarRecursoDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_EDITAR);
    await this.obtenerPorId(id, usuarioAuth);

    const payload = tieneAccesoTotal(usuarioAuth)
      ? data
      : { ...data, institucionId: undefined };

    return await this.prisma.recurso.update({
      where: { id },
      data: payload,
      include: this.includeRecursoDetalle,
    });
  }

  async inactivar(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_CAMBIAR_ESTADO);
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.recurso.update({
      where: { id },
      data: { estado: false },
      include: this.includeRecursoDetalle,
    });
  }

  async reactivar(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_CAMBIAR_ESTADO);
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.recurso.update({
      where: { id },
      data: { estado: true },
      include: this.includeRecursoDetalle,
    });
  }

  async validarSubidaArchivo(usuarioAuth: any, file: Express.Multer.File) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_SUBIR_ARCHIVO);

    if (!file) {
      throw new BadRequestException('Debe enviar un archivo');
    }

    return { ruta: `/uploads/recursos/${file.filename}` };
  }
}
