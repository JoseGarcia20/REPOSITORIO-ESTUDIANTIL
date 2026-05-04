import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuarioService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para validar acceso administrativo
  private async validarAdministrador(usuarioAuth: any) {
    const rol = await this.prisma.rol.findUnique({ where: { id: Number(usuarioAuth?.rolId) } });
    if (!rol) throw new ForbiddenException('Rol no válido');

    const nombreRol = rol.nombre.toLowerCase();
    if (nombreRol !== 'superadministrador' && nombreRol !== 'administrador institucional') {
      throw new ForbiddenException('No tiene permisos para administrar usuarios');
    }

    return { esSuper: nombreRol === 'superadministrador' };
  }

  async crear(data: CrearUsuarioDto, usuarioAuth: any) {
    const { esSuper } = await this.validarAdministrador(usuarioAuth);
    try {
      const contrasenaEncriptada = await bcrypt.hash(data.contrasena, 10);
      return await this.prisma.usuario.create({
        data: {
          ...data,
          institucionId: esSuper ? data.institucionId : Number(usuarioAuth?.institucionId),
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
    const { esSuper } = await this.validarAdministrador(usuarioAuth);
    return await this.prisma.usuario.findMany({
      where: { activo: true, ...(esSuper ? {} : { institucionId: Number(usuarioAuth?.institucionId) }) },
      orderBy: { id: 'desc' },
    });
  }

  async listarTodos(usuarioAuth: any) {
    const { esSuper } = await this.validarAdministrador(usuarioAuth);
    return await this.prisma.usuario.findMany({
      where: esSuper ? {} : { institucionId: Number(usuarioAuth?.institucionId) },
      orderBy: { id: 'desc' },
    });
  }

  async obtenerPorId(id: number, usuarioAuth: any) {
    await this.validarAdministrador(usuarioAuth);
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    if (Number(usuarioAuth?.institucionId) !== usuario.institucionId) {
      const { esSuper } = await this.validarAdministrador(usuarioAuth);
      if (!esSuper) throw new ForbiddenException('No puede consultar usuarios de otra institución');
    }
    return usuario;
  }

  async actualizar(id: number, data: ActualizarUsuarioDto, usuarioAuth: any) {
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.usuario.update({ where: { id }, data });
  }

  async inactivar(id: number, usuarioAuth: any) {
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.usuario.update({ where: { id }, data: { activo: false } });
  }

  async reactivar(id: number, usuarioAuth: any) {
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.usuario.update({ where: { id }, data: { activo: true } });
  }
}
