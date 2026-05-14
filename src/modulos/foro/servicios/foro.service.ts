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
      },
    },
  };

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
      condiciones.push({ categoriaId: Number(query.categoriaId) });
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
      throw new ForbiddenException('No tiene permisos para crear foros públicos');
    }

    const institucionId = tieneAccesoTotal(usuarioAuth)
      ? Number(data.institucionId || usuarioAuth?.institucionId)
      : Number(usuarioAuth?.institucionId);

    if (!institucionId) {
      throw new BadRequestException('Debe indicar una institución válida');
    }

    const categoria = await this.prisma.categoria.findUnique({
      where: { id: data.categoriaId },
    });

    if (!categoria || !categoria.estado) {
      throw new BadRequestException('Debe indicar una categoría válida');
    }

    if (!tieneAccesoTotal(usuarioAuth) && categoria.institucionId !== institucionId) {
      throw new ForbiddenException('No puede usar categorías de otra institución');
    }

    if (tieneAccesoTotal(usuarioAuth) && categoria.institucionId !== institucionId) {
      throw new BadRequestException(
        'La categoría debe pertenecer a la institución seleccionada',
      );
    }

    return await this.prisma.foro.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        publico,
        institucionId,
        categoriaId: data.categoriaId,
        usuarioId: Number(usuarioAuth?.sub),
      },
      include: this.includeForoDetalle,
    });
  }

  async listar(usuarioAuth: any, query: ConsultaPaginada = {}) {
    validarPermiso(usuarioAuth, PERMISOS.FOROS_VER);
    const { pagina, limite, skip, busqueda } = obtenerPaginacion(query);
    const where = this.construirFiltroForos(
      usuarioAuth,
      query,
      true,
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

    return respuestaPaginada(data, total, pagina, limite);
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

    return respuestaPaginada(data, total, pagina, limite);
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

    return foro;
  }

  async actualizar(id: number, data: ActualizarForoDto, usuarioAuth: any) {
    const foro = await this.obtenerPorId(id, usuarioAuth);

    if (!tieneAccesoTotal(usuarioAuth) && foro.usuarioId !== Number(usuarioAuth?.sub)) {
      throw new ForbiddenException('Solo el creador puede editar este foro');
    }

    if (data.publico && !tienePermiso(usuarioAuth, PERMISOS.FOROS_CREAR_PUBLICO)) {
      throw new ForbiddenException('No tiene permisos para publicar foros globales');
    }

    const payload = tieneAccesoTotal(usuarioAuth)
      ? data
      : {
          ...data,
          institucionId: undefined,
          usuarioId: undefined,
        };

    return await this.prisma.foro.update({
      where: { id },
      data: payload,
      include: this.includeForoDetalle,
    });
  }

  async cerrar(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.FOROS_CERRAR);
    const foro = await this.obtenerPorId(id, usuarioAuth);

    if (!tieneAccesoTotal(usuarioAuth) && foro.usuarioId !== Number(usuarioAuth?.sub)) {
      throw new ForbiddenException('Solo el creador puede cerrar este foro');
    }

    return await this.prisma.foro.update({
      where: { id },
      data: {
        cerrado: true,
        fechaCierre: new Date(),
      },
      include: this.includeForoDetalle,
    });
  }

  async inactivar(id: number, usuarioAuth: any) {
    const foro = await this.obtenerPorId(id, usuarioAuth);

    if (!tieneAccesoTotal(usuarioAuth) && foro.usuarioId !== Number(usuarioAuth?.sub)) {
      throw new ForbiddenException('Solo el creador puede inactivar este foro');
    }

    return await this.prisma.foro.update({
      where: { id },
      data: {
        estado: false,
      },
      include: this.includeForoDetalle,
    });
  }

  async reactivar(id: number, usuarioAuth: any) {
    const foro = await this.obtenerPorId(id, usuarioAuth);

    if (!tieneAccesoTotal(usuarioAuth) && foro.usuarioId !== Number(usuarioAuth?.sub)) {
      throw new ForbiddenException('Solo el creador puede reactivar este foro');
    }

    return await this.prisma.foro.update({
      where: { id },
      data: {
        estado: true,
      },
      include: this.includeForoDetalle,
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
      throw new BadRequestException('Este foro ya está cerrado para comentarios');
    }

    return await this.prisma.comentarioForo.create({
      data: {
        contenido: data.contenido,
        foroId,
        usuarioId: Number(usuarioAuth?.sub),
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
      },
    });
  }
}
