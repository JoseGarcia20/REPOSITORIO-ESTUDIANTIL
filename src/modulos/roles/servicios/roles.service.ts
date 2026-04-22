import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearRolesDto } from '../dto/crear-roles.dto';
import { ActualizarRolesDto } from '../dto/actualizar-roles.dto';

@Injectable()
export class RolesService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de un nuevo rol
  async crear(data: CrearRolesDto) {
    try {
      return await this.prisma.rol.create({
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
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

        if (campo === 'nombre') {
          throw new ConflictException('Ya existe un rol con ese nombre');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para listar todos los roles
  async listar() {
    return await this.prisma.rol.findMany({
      where: {
        estado: true, //Solo se listan los roles activos
      },
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los roles mas recientes primero
      },
    });
  }

  //Funcion para listar todos los roles, incluyendo los inactivos
  async listarTodos() {
    return await this.prisma.rol.findMany({
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los roles mas recientes primero
      },
    });
  }

  //Funcion para obtener un rol por su id
  async obtenerPorId(id: number) {
    const rol = await this.prisma.rol.findUnique({
      where: { id },
    });

    if (!rol) {
      throw new NotFoundException(`Rol con id ${id} no encontrado`);
    }

    return rol;
  }

  //Funcion para actualizar un rol por su id
  async actualizar(id: number, data: ActualizarRolesDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.rol.update({
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

        if (campo === 'nombre') {
          throw new ConflictException('Ya existe un rol con ese nombre');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para inactivar un rol por su id
  async inactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.rol.update({
      where: { id },
      data: {
        estado: false,
      },
    });
  }

  //Funcion para reactivar un rol por su id
  async reactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.rol.update({
      where: { id },
      data: {
        estado: true,
      },
    });
  }

}