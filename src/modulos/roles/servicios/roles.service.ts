import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearRolesDto } from '../dto/crear-roles.dto';
import { ActualizarRolesDto } from '../dto/actualizar-roles.dto';
import { PERMISOS, tieneAccesoTotal, tienePermiso, validarPermiso } from '../../auth/utils/roles.util';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}
  async crear(data: CrearRolesDto, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.ROLES_CREAR); try { return await this.prisma.rol.create({ data: { nombre: data.nombre, descripcion: data.descripcion } }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Ya existe un rol con ese nombre'); throw error; } }
  async listar(usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.ROLES_VER); return await this.prisma.rol.findMany({ where: { estado: true }, orderBy: { id: 'desc' } }); }
  async listarTodos(usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.ROLES_VER); return await this.prisma.rol.findMany({ orderBy: { id: 'desc' } }); }
  async listarAsignables(usuarioAuth: any) {
    const puedeAsignarRoles =
      tienePermiso(usuarioAuth, PERMISOS.USUARIOS_CREAR) ||
      tienePermiso(usuarioAuth, PERMISOS.USUARIOS_EDITAR) ||
      tienePermiso(usuarioAuth, PERMISOS.ROLES_VER);

    if (!puedeAsignarRoles) {
      throw new ForbiddenException('No tiene permisos para consultar roles asignables');
    }

    return await this.prisma.rol.findMany({
      where: {
        estado: true,
        ...(tieneAccesoTotal(usuarioAuth)
          ? {}
          : {
              permisos: {
                none: {
                  permiso: {
                    codigo: PERMISOS.SISTEMA_TOTAL,
                  },
                },
              },
            }),
      },
      orderBy: { id: 'asc' },
    });
  }
  async obtenerPorId(id: number, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.ROLES_VER); const rol = await this.prisma.rol.findUnique({ where: { id } }); if (!rol) throw new NotFoundException(`Rol con id ${id} no encontrado`); return rol; }
  async actualizar(id: number, data: ActualizarRolesDto, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.ROLES_EDITAR); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.rol.update({ where: { id }, data }); }
  async inactivar(id: number, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.ROLES_CAMBIAR_ESTADO); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.rol.update({ where: { id }, data: { estado: false } }); }
  async reactivar(id: number, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.ROLES_CAMBIAR_ESTADO); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.rol.update({ where: { id }, data: { estado: true } }); }
}
