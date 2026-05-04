import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearRolesDto } from '../dto/crear-roles.dto';
import { ActualizarRolesDto } from '../dto/actualizar-roles.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}
  private async validarAdministrador(usuarioAuth: any) {
    const rol = await this.prisma.rol.findUnique({ where: { id: Number(usuarioAuth?.rolId) } });
    if (!rol) throw new ForbiddenException('Rol no válido');
    const nombreRol = rol.nombre.toLowerCase();
    if (nombreRol !== 'superadministrador' && nombreRol !== 'administrador institucional') throw new ForbiddenException('No tiene permisos para administrar roles');
  }
  async crear(data: CrearRolesDto, usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); try { return await this.prisma.rol.create({ data: { nombre: data.nombre, descripcion: data.descripcion } }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Ya existe un rol con ese nombre'); throw error; } }
  async listar(usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); return await this.prisma.rol.findMany({ where: { estado: true }, orderBy: { id: 'desc' } }); }
  async listarTodos(usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); return await this.prisma.rol.findMany({ orderBy: { id: 'desc' } }); }
  async obtenerPorId(id: number, usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); const rol = await this.prisma.rol.findUnique({ where: { id } }); if (!rol) throw new NotFoundException(`Rol con id ${id} no encontrado`); return rol; }
  async actualizar(id: number, data: ActualizarRolesDto, usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.rol.update({ where: { id }, data }); }
  async inactivar(id: number, usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.rol.update({ where: { id }, data: { estado: false } }); }
  async reactivar(id: number, usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.rol.update({ where: { id }, data: { estado: true } }); }
}
