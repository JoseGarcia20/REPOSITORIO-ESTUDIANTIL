import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearTiposRecursosDto } from '../dto/crear-tiposRecursos';
import { ActualizarTiposRecursosDto } from '../dto/actualizar-tiposRecursos';

@Injectable()
export class TiposRecursosService {
  constructor(private readonly prisma: PrismaService) {}
  private async validarAdministrador(usuarioAuth: any) {
    const rol = await this.prisma.rol.findUnique({ where: { id: Number(usuarioAuth?.rolId) } });
    if (!rol) throw new ForbiddenException('Rol no válido');
    const nombreRol = rol.nombre.toLowerCase();
    if (nombreRol !== 'superadministrador' && nombreRol !== 'administrador institucional') throw new ForbiddenException('No tiene permisos para administrar tipos de recursos');
  }
  async crear(data: CrearTiposRecursosDto, usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); try { return await this.prisma.tipoRecurso.create({ data: { nombre: data.nombre, descripcion: data.descripcion, icono: data.icono } }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Ya existe un tipo de recurso con ese nombre'); throw error; } }
  async listar(usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); return await this.prisma.tipoRecurso.findMany({ where: { estado: true }, orderBy: { id: 'desc' } }); }
  async listarTodos(usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); return await this.prisma.tipoRecurso.findMany({ orderBy: { id: 'desc' } }); }
  async obtenerPorId(id: number, usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); const tipoRecurso = await this.prisma.tipoRecurso.findUnique({ where: { id } }); if (!tipoRecurso) throw new NotFoundException(`Tipo de recurso con id ${id} no encontrado`); return tipoRecurso; }
  async actualizar(id: number, data: ActualizarTiposRecursosDto, usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.tipoRecurso.update({ where: { id }, data }); }
  async inactivar(id: number, usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.tipoRecurso.update({ where: { id }, data: { estado: false } }); }
  async reactivar(id: number, usuarioAuth: any) { await this.validarAdministrador(usuarioAuth); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.tipoRecurso.update({ where: { id }, data: { estado: true } }); }
}
