import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearRecursoDto } from '../dto/crear-recurso.dto';
import { ActualizarRecursoDto } from '../dto/actualizar-recurso.dto';

@Injectable()
export class RecursoService {
  constructor(private readonly prisma: PrismaService) {}
  private async validarAdministrador(usuarioAuth: any) {
    const rol = await this.prisma.rol.findUnique({ where: { id: Number(usuarioAuth?.rolId) } });
    if (!rol) throw new ForbiddenException('Rol no válido');
    const nombreRol = rol.nombre.toLowerCase();
    if (nombreRol !== 'superadministrador' && nombreRol !== 'administrador institucional') throw new ForbiddenException('No tiene permisos para administrar recursos');
    return { esSuper: nombreRol === 'superadministrador' };
  }
  async crear(data: CrearRecursoDto, usuarioAuth: any) { const { esSuper } = await this.validarAdministrador(usuarioAuth); try { return await this.prisma.recurso.create({ data: { ...data, institucionId: esSuper ? data.institucionId : Number(usuarioAuth?.institucionId) } }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Ya existe un recurso con ese dato único.'); throw error; } }
  async listar(usuarioAuth: any) { const { esSuper } = await this.validarAdministrador(usuarioAuth); return await this.prisma.recurso.findMany({ where: { estado: true, ...(esSuper ? {} : { institucionId: Number(usuarioAuth?.institucionId) }) }, orderBy: { id: 'desc' } }); }
  async listarTodos(usuarioAuth: any) { const { esSuper } = await this.validarAdministrador(usuarioAuth); return await this.prisma.recurso.findMany({ where: esSuper ? {} : { institucionId: Number(usuarioAuth?.institucionId) }, orderBy: { id: 'desc' } }); }
  async obtenerPorId(id: number, usuarioAuth: any) { const { esSuper } = await this.validarAdministrador(usuarioAuth); const recurso = await this.prisma.recurso.findUnique({ where: { id } }); if (!recurso) throw new NotFoundException(`Recurso con id ${id} no encontrado`); if (!esSuper && recurso.institucionId !== Number(usuarioAuth?.institucionId)) throw new ForbiddenException('No puede consultar recursos de otra institución'); return recurso; }
  async actualizar(id: number, data: ActualizarRecursoDto, usuarioAuth: any) { await this.obtenerPorId(id, usuarioAuth); return await this.prisma.recurso.update({ where: { id }, data }); }
  async inactivar(id: number, usuarioAuth: any) { await this.obtenerPorId(id, usuarioAuth); return await this.prisma.recurso.update({ where: { id }, data: { estado: false } }); }
  async reactivar(id: number, usuarioAuth: any) { await this.obtenerPorId(id, usuarioAuth); return await this.prisma.recurso.update({ where: { id }, data: { estado: true } }); }
}
