import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearForoDto } from '../dto/crear-foro.dto';
import { ActualizarForoDto } from '../dto/actualizar-foro.dto';

@Injectable()
export class ForoService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de un nuevo foro
  async crear(data: CrearForoDto) {
    try {
      return await this.prisma.foro.create({
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

        if (campo === 'titulo') {
          throw new ConflictException('Ya existe un foro con ese titulo');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para listar todas los foros activos, ordenados por id de forma descendente para mostrar los usuarios mas recientes primero
  async listar() {
    return await this.prisma.foro.findMany({
      where: {
        estado: true, //Solo se listan los foros activos
      },
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los usuarios mas recientes primero
      },
    });
  }

  //Funcion para listar todas los foros, incluyendo los inactivos
  async listarTodos() {
    return await this.prisma.foro.findMany({
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los foros mas recientes primero
      },
    });
  }

  //Funcion para obtener un foro por su id
  async obtenerPorId(id: number) {
    const foro = await this.prisma.foro.findUnique({
      where: { id },
    });

    if (!foro) {
      throw new NotFoundException(`Foro con id ${id} no encontrado`);
    }

    return foro;

  }

  //Funcion para actualizar un foro por su id
  async actualizar(id: number, data: ActualizarForoDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.foro.update({
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

        if (campo === 'titulo') {
          throw new ConflictException('Ya existe un foro con ese titulo');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para inactivar un foro por su id
  async inactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.foro.update({
      where: { id },
      data: {
        estado: false,
      },
    });
  }

  //Funcion para reactivar un foro por su id
  async reactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.foro.update({
      where: { id },
      data: {
        estado: true,
      },
    });
  }

}