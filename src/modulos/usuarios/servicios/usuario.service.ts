import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuarioService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de un nuevo usuario
  async crear(data: CrearUsuarioDto) {
    try {

      //Encriptar la contraseña antes de guardarla en la base de datos
      const contrasenaEncriptada = await bcrypt.hash(data.contrasena, 10);

      return await this.prisma.usuario.create({
        data: {
          ...data,
          fechaNacimiento: new Date(data.fechaNacimiento),
          contrasena: contrasenaEncriptada,
        },
      });

    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const campo = Array.isArray(error.meta?.target)
          ? error.meta.target[0]
          : 'campo único';

        if (campo === 'identificacion') {
          throw new ConflictException('Ya existe un usuario con esa identificación');
        }

        if (campo === 'correo') {
          throw new ConflictException('Ya existe un usuario con ese correo');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para listar todas los usuarios activos, ordenados por id de forma descendente para mostrar los usuarios mas recientes primero
  async listar() {
    return await this.prisma.usuario.findMany({
      where: {
        activo: true, //Solo se listan los usuarios activos
      },
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los usuarios mas recientes primero
      },
    });
  }

  //Funcion para listar todas los usuarios, incluyendo los inactivos
  async listarTodos() {
    return await this.prisma.usuario.findMany({
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los usuarios mas recientes primero
      },
    });
  }

  //Funcion para obtener un usuario por su id
  async obtenerPorId(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return usuario;

  }

  //Funcion para actualizar un usuario por su id
  async actualizar(id: number, data: ActualizarUsuarioDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.usuario.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const campo = Array.isArray(error.meta?.target)
          ? error.meta.target[0]
          : 'campo único';

        if (campo === 'identificacion') {
          throw new ConflictException('Ya existe un usuario con esa identificación');
        }

        if (campo === 'correo') {
          throw new ConflictException('Ya existe un usuario con ese correo');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para inactivar un usuario por su id
  async inactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.usuario.update({
      where: { id },
      data: {
        activo: false,
      },
    });
  }

  //Funcion para reactivar un usuario por su id
  async reactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.usuario.update({
      where: { id },
      data: {
        activo: true,
      },
    });
  }

}