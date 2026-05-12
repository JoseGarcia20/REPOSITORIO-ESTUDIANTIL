import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import * as bcrypt from 'bcryptjs';
import {
  PERMISOS,
  tieneAccesoTotal,
  validarAlcanceInstitucional,
  validarPermiso,
} from '../../auth/utils/roles.util';

@Injectable()
export class UsuarioService {

  constructor(private readonly prisma: PrismaService) {}

  private async validarRolAsignable(rolId: number, usuarioAuth: any) {
    if (tieneAccesoTotal(usuarioAuth)) {
      return;
    }

    const rol = await this.prisma.rol.findUnique({
      where: { id: rolId },
      include: {
        permisos: {
          include: {
            permiso: true,
          },
        },
      },
    });

    if (!rol) {
      throw new ForbiddenException('Rol no válido');
    }

    const asignaAccesoTotal = rol.permisos.some(
      (item) => item.permiso.codigo === PERMISOS.SISTEMA_TOTAL,
    );

    if (asignaAccesoTotal) {
      throw new ForbiddenException('No puede asignar un rol de acceso total');
    }
  }

  async crear(data: CrearUsuarioDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_CREAR);
    await this.validarRolAsignable(data.rolId, usuarioAuth);

    try {
      const contrasenaEncriptada = await bcrypt.hash(data.contrasena, 10);
      return await this.prisma.usuario.create({
        data: {
          ...data,
          institucionId: tieneAccesoTotal(usuarioAuth) ? data.institucionId : Number(usuarioAuth?.institucionId),
          fechaNacimiento: new Date(data.fechaNacimiento),
          contrasena: contrasenaEncriptada,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe un usuario con ese dato único');
      }
      throw error;
    }
  }

  async listar(usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_VER);
    const esGlobal = tieneAccesoTotal(usuarioAuth);
    return await this.prisma.usuario.findMany({
      where: { activo: true, ...(esGlobal ? {} : { institucionId: Number(usuarioAuth?.institucionId) }) },
      orderBy: { id: 'desc' },
    });
  }

  async listarTodos(usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_VER);
    const esGlobal = tieneAccesoTotal(usuarioAuth);
    return await this.prisma.usuario.findMany({
      where: esGlobal ? {} : { institucionId: Number(usuarioAuth?.institucionId) },
      orderBy: { id: 'desc' },
    });
  }

  async obtenerPorId(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_VER);
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    validarAlcanceInstitucional(usuarioAuth, usuario.institucionId);
    return usuario;
  }

  async actualizar(id: number, data: ActualizarUsuarioDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_EDITAR);
    await this.obtenerPorId(id, usuarioAuth);

    if (data.rolId) {
      await this.validarRolAsignable(data.rolId, usuarioAuth);
    }

    const payload = {
      ...data,
      institucionId: tieneAccesoTotal(usuarioAuth)
        ? data.institucionId
        : undefined,
      fechaNacimiento: data.fechaNacimiento
        ? new Date(data.fechaNacimiento)
        : undefined,
    };

    return await this.prisma.usuario.update({ where: { id }, data: payload });
  }

  async inactivar(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_CAMBIAR_ESTADO);
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.usuario.update({ where: { id }, data: { activo: false } });
  }

  async reactivar(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_CAMBIAR_ESTADO);
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.usuario.update({ where: { id }, data: { activo: true } });
  }
}
