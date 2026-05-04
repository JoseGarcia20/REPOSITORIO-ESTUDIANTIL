import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearCategoriasDto } from '../dto/crear-categorias.dto';
import { ActualizarCategoriasDto } from '../dto/actualizar-categorias.dto';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarAdministrador(usuarioAuth: any) {
    const rol = await this.prisma.rol.findUnique({ where: { id: Number(usuarioAuth?.rolId) } });
    if (!rol) throw new ForbiddenException('Rol no válido');
    const nombreRol = rol.nombre.toLowerCase();
    if (nombreRol !== 'superadministrador' && nombreRol !== 'administrador institucional') {
      throw new ForbiddenException('No tiene permisos para administrar categorías');
    }
    return { esSuper: nombreRol === 'superadministrador' };
  }

  async crear(data: CrearCategoriasDto, usuarioAuth: any) {
    const { esSuper } = await this.validarAdministrador(usuarioAuth);
    try {
      return await this.prisma.categoria.create({ data: { ...data, institucionId: esSuper ? data.institucionId : Number(usuarioAuth?.institucionId) } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Ya existe una categoría con ese dato único');
      throw error;
    }
  }

  async listar(usuarioAuth: any) {
    const { esSuper } = await this.validarAdministrador(usuarioAuth);
    return await this.prisma.categoria.findMany({ where: { estado: true, ...(esSuper ? {} : { institucionId: Number(usuarioAuth?.institucionId) }) }, orderBy: { id: 'desc' } });
  }
  async listarTodas(usuarioAuth: any) {
    const { esSuper } = await this.validarAdministrador(usuarioAuth);
    return await this.prisma.categoria.findMany({ where: esSuper ? {} : { institucionId: Number(usuarioAuth?.institucionId) }, orderBy: { id: 'desc' } });
  }
  async obtenerPorId(id: number, usuarioAuth: any) {
    const { esSuper } = await this.validarAdministrador(usuarioAuth);
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    if (!categoria) throw new NotFoundException(`Categoria con id ${id} no encontrada`);
    if (!esSuper && categoria.institucionId !== Number(usuarioAuth?.institucionId)) throw new ForbiddenException('No puede consultar categorías de otra institución');
    return categoria;
  }
  async actualizar(id: number, data: ActualizarCategoriasDto, usuarioAuth: any) { await this.obtenerPorId(id, usuarioAuth); return await this.prisma.categoria.update({ where: { id }, data }); }
  async inactivar(id: number, usuarioAuth: any) { await this.obtenerPorId(id, usuarioAuth); return await this.prisma.categoria.update({ where: { id }, data: { estado: false } }); }
  async reactivar(id: number, usuarioAuth: any) { await this.obtenerPorId(id, usuarioAuth); return await this.prisma.categoria.update({ where: { id }, data: { estado: true } }); }
}
