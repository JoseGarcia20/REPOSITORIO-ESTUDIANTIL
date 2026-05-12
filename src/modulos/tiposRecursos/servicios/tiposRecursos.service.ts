import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearTiposRecursosDto } from '../dto/crear-tiposRecursos';
import { ActualizarTiposRecursosDto } from '../dto/actualizar-tiposRecursos';
import { PERMISOS, validarPermiso } from '../../auth/utils/roles.util';

@Injectable()
export class TiposRecursosService {
  constructor(private readonly prisma: PrismaService) {}
  async crear(data: CrearTiposRecursosDto, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.TIPOS_RECURSOS_CREAR); try { return await this.prisma.tipoRecurso.create({ data: { nombre: data.nombre, descripcion: data.descripcion, icono: data.icono } }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Ya existe un tipo de recurso con ese nombre'); throw error; } }
  async listar(usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.TIPOS_RECURSOS_VER); return await this.prisma.tipoRecurso.findMany({ where: { estado: true }, orderBy: { id: 'desc' } }); }
  async listarTodos(usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.TIPOS_RECURSOS_VER); return await this.prisma.tipoRecurso.findMany({ orderBy: { id: 'desc' } }); }
  async obtenerPorId(id: number, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.TIPOS_RECURSOS_VER); const tipoRecurso = await this.prisma.tipoRecurso.findUnique({ where: { id } }); if (!tipoRecurso) throw new NotFoundException(`Tipo de recurso con id ${id} no encontrado`); return tipoRecurso; }
  async actualizar(id: number, data: ActualizarTiposRecursosDto, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.TIPOS_RECURSOS_EDITAR); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.tipoRecurso.update({ where: { id }, data }); }
  async inactivar(id: number, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.TIPOS_RECURSOS_CAMBIAR_ESTADO); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.tipoRecurso.update({ where: { id }, data: { estado: false } }); }
  async reactivar(id: number, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.TIPOS_RECURSOS_CAMBIAR_ESTADO); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.tipoRecurso.update({ where: { id }, data: { estado: true } }); }
}
