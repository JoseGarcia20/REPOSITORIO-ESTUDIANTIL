import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearTiposAprendizajeDto } from '../dto/crear-tiposAprendizaje';
import { ActualizarTiposAprendizajeDto } from '../dto/actualizar-tiposAprendizaje';

@Injectable()
export class TiposAprendizajeService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de un nuevo tipo de aprendizaje
  async crear(data: CrearTiposAprendizajeDto) {
    try {
      return await this.prisma.tipoAprendizaje.create({
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
          throw new ConflictException('Ya existe un tipo de aprendizaje con ese nombre');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para listar todos los tipos de aprendizaje
  async listar() {
    return await this.prisma.tipoAprendizaje.findMany({
      where: {
        estado: true, //Solo se listan los tipos de aprendizaje activos
      },
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los tipos de aprendizaje mas recientes primero
      },
    });
  }

  //Funcion para listar todos los tipos de aprendizaje, incluyendo los inactivos
  async listarTodos() {
    return await this.prisma.tipoAprendizaje.findMany({
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los tipos de aprendizaje mas recientes primero
      },
    });
  }

  //Funcion para obtener un tipo de aprendizaje por su id
  async obtenerPorId(id: number) {
    const tipoAprendizaje = await this.prisma.tipoAprendizaje.findUnique({
      where: { id },
    });

    if (!tipoAprendizaje) {
      throw new NotFoundException(`Tipo de aprendizaje con id ${id} no encontrado`);
    }

    return tipoAprendizaje;
  }

  //Funcion para actualizar un tipo de aprendizaje por su id
  async actualizar(id: number, data: ActualizarTiposAprendizajeDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.tipoAprendizaje.update({
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
          throw new ConflictException('Ya existe un tipo de aprendizaje con ese nombre');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para inactivar un tipo de aprendizaje por su id
  async inactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.tipoAprendizaje.update({
      where: { id },
      data: {
        estado: false,
      },
    });
  }

  //Funcion para reactivar un tipo de aprendizaje por su id
  async reactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.tipoAprendizaje.update({
      where: { id },
      data: {
        estado: true,
      },
    });
  }

}