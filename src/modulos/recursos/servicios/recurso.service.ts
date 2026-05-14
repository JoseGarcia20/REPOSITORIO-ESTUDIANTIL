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
  };

  private construirFiltroRecursos(
    usuarioAuth: any,
    query: ConsultaPaginada,
    soloActivos: boolean,
    busqueda?: string,
  ): Prisma.RecursoWhereInput {
    const esGlobal = tieneAccesoTotal(usuarioAuth);
    const where: Prisma.RecursoWhereInput = {
      ...(soloActivos ? { estado: true } : {}),
      ...(esGlobal ? {} : { institucionId: Number(usuarioAuth?.institucionId) }),
    };

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

    if (busqueda) {
      where.OR = [
        { titulo: { contains: busqueda, mode: 'insensitive' } },
        { palabrasClave: { contains: busqueda, mode: 'insensitive' } },
        { contenidoResumen: { contains: busqueda, mode: 'insensitive' } },
        { fuente: { contains: busqueda, mode: 'insensitive' } },
        { autorNombre: { contains: busqueda, mode: 'insensitive' } },
        { nivelAcademico: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  async crear(data: CrearRecursoDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_CREAR);

    try {
      return await this.prisma.recurso.create({
        data: {
          ...data,
          institucionId: tieneAccesoTotal(usuarioAuth)
            ? data.institucionId
            : Number(usuarioAuth?.institucionId),
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
