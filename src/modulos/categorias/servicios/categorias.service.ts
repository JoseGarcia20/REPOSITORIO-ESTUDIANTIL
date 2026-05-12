import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearCategoriasDto } from '../dto/crear-categorias.dto';
import { ActualizarCategoriasDto } from '../dto/actualizar-categorias.dto';
import {
  PERMISOS,
  tieneAccesoTotal,
  validarAlcanceInstitucional,
  validarPermiso,
} from '../../auth/utils/roles.util';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(data: CrearCategoriasDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.CATEGORIAS_CREAR);
    const institucionId = tieneAccesoTotal(usuarioAuth) ? Number(data.institucionId) : Number(usuarioAuth?.institucionId);

    if (!institucionId) {
      throw new BadRequestException('Debe indicar una institución válida');
    }

    try {
      return await this.prisma.categoria.create({
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          color: data.color,
          estado: data.estado,
          institucionId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Ya existe una categoría con ese dato único');
      throw error;
    }
  }

  async listar(usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.CATEGORIAS_VER);
    const esGlobal = tieneAccesoTotal(usuarioAuth);
    return await this.prisma.categoria.findMany({ where: { estado: true, ...(esGlobal ? {} : { institucionId: Number(usuarioAuth?.institucionId) }) }, orderBy: { id: 'desc' } });
  }
  async listarTodas(usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.CATEGORIAS_VER);
    const esGlobal = tieneAccesoTotal(usuarioAuth);
    return await this.prisma.categoria.findMany({ where: esGlobal ? {} : { institucionId: Number(usuarioAuth?.institucionId) }, orderBy: { id: 'desc' } });
  }
  async obtenerPorId(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.CATEGORIAS_VER);
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    if (!categoria) throw new NotFoundException(`Categoria con id ${id} no encontrada`);
    validarAlcanceInstitucional(usuarioAuth, categoria.institucionId);
    return categoria;
  }
  async actualizar(id: number, data: ActualizarCategoriasDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.CATEGORIAS_EDITAR);
    await this.obtenerPorId(id, usuarioAuth);
    const payload = tieneAccesoTotal(usuarioAuth) ? data : { ...data, institucionId: undefined };
    return await this.prisma.categoria.update({ where: { id }, data: payload });
  }
  async inactivar(id: number, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.CATEGORIAS_CAMBIAR_ESTADO); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.categoria.update({ where: { id }, data: { estado: false } }); }
  async reactivar(id: number, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.CATEGORIAS_CAMBIAR_ESTADO); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.categoria.update({ where: { id }, data: { estado: true } }); }
}
