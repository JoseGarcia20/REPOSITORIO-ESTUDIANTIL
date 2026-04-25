import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearRespuestaForoDto } from '../dto/crear-respuestaForo.dto';
import { ActualizarRespuestaForoDto } from '../dto/actualizar-respuestaForo.dto';

@Injectable()
export class RespuestaForoService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de un nuevo RF
  async crear(data: CrearRespuestaForoDto) {
    try {
      return await this.prisma.respuestaForo.create({
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

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para listar todos los RF
  async listar() {
    return await this.prisma.respuestaForo.findMany({
      where: {
        estado: true, //Solo se listan las RF activos
      },
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar las RF mas recientes primero
      },
    });
  }

  //Funcion para listar todos los RF, incluyendo los inactivos
  async listarTodos() {
    return await this.prisma.respuestaForo.findMany({
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar las RF mas recientes primero
      },
    });
  }

  //Funcion para obtener un RF por su id
  async obtenerPorId(id: number) {
    const rol = await this.prisma.respuestaForo.findUnique({
      where: { id },
    });

    if (!rol) {
      throw new NotFoundException(`Respuesta Foro con id ${id} no encontrado`);
    }

    return rol;
  }

  //Funcion para actualizar un RF por su id
  async actualizar(id: number, data: ActualizarRespuestaForoDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.respuestaForo.update({
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

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para inactivar un RF por su id
  async inactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.respuestaForo.update({
      where: { id },
      data: {
        estado: false,
      },
    });
  }

  //Funcion para reactivar un RF por su id
  async reactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.respuestaForo.update({
      where: { id },
      data: {
        estado: true,
      },
    });
  }

}