import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearRutaAprendizajeDto } from '../dto/crear-rutaAprendizaje.dto';
import { ActualizarRutaAprendizajeDto } from '../dto/actualizar-rutaAprendizaje.dto';

@Injectable()
export class RutaAprendizajeService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de un nuevo RA
  async crear(data: CrearRutaAprendizajeDto) {
    try {
      return await this.prisma.rutaAprendizaje.create({
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

        if (campo === 'tituo') {
          throw new ConflictException('Ya existe una ruta de aprendizaje con ese titulo');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para listar todas los RA activos, ordenados por id de forma descendente para mostrar los usuarios mas recientes primero
  async listar() {
    return await this.prisma.rutaAprendizaje.findMany({
      where: {
        estado: true, //Solo se listan los RA activos
      },
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los RA mas recientes primero
      },
    });
  }

  //Funcion para listar todas los RA, incluyendo los inactivos
  async listarTodos() {
    return await this.prisma.rutaAprendizaje.findMany({
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los RA mas recientes primero
      },
    });
  }

  //Funcion para obtener un RA por su id
  async obtenerPorId(id: number) {
    const rutaAprendizaje = await this.prisma.rutaAprendizaje.findUnique({
      where: { id },
    });

    if (!rutaAprendizaje) {
      throw new NotFoundException(`Ruta de Aprendizaje con id ${id} no encontrado`);
    }

    return rutaAprendizaje;

  }

  //Funcion para actualizar un RA por su id
  async actualizar(id: number, data: ActualizarRutaAprendizajeDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.rutaAprendizaje.update({
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

        if (campo === 'tituo') {
          throw new ConflictException('Ya existe una ruta de aprendizaje con ese titulo');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para inactivar un RA por su id
  async inactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.rutaAprendizaje.update({
      where: { id },
      data: {
        estado: false,
      },
    });
  }

  //Funcion para reactivar un RA por su id
  async reactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.rutaAprendizaje.update({
      where: { id },
      data: {
        estado: true,
      },
    });
  }

}