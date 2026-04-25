import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearRecursoDto } from '../dto/crear-recurso.dto';
import { ActualizarRecursoDto } from '../dto/actualizar-recurso.dto';

@Injectable()
export class RecursoService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de un nuevo recurso
  async crear(data: CrearRecursoDto) {
    try {
      return await this.prisma.recurso.create({
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
          throw new ConflictException('Ya existe un recurso con ese titulo.');
        }

        if (campo === 'urlRecurso') {
          throw new ConflictException('Ya existe un recurso con esa URL.');
        }

        if (campo === 'rutaRecurso') {
          throw new ConflictException('Ya existe un recurso con esa ruta.');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para listar todas los recursos activos, ordenados por id de forma descendente para mostrar los usuarios mas recientes primero
  async listar() {
    return await this.prisma.recurso.findMany({
      where: {
        estado: true, //Solo se listan los recursos activos
      },
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los usuarios mas recientes primero
      },
    });
  }

  //Funcion para listar todas los recursos, incluyendo los inactivos
  async listarTodos() {
    return await this.prisma.recurso.findMany({
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los usuarios mas recientes primero
      },
    });
  }

  //Funcion para obtener un recurso por su id
  async obtenerPorId(id: number) {
    const recurso = await this.prisma.recurso.findUnique({
      where: { id },
    });

    if (!recurso) {
      throw new NotFoundException(`Recurso con id ${id} no encontrado`);
    }

    return recurso;

  }

  //Funcion para actualizar un recurso por su id
  async actualizar(id: number, data: ActualizarRecursoDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.recurso.update({
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
          throw new ConflictException('Ya existe un recurso con ese titulo.');
        }

        if (campo === 'urlRecurso') {
          throw new ConflictException('Ya existe un recurso con esa URL.');
        }

        if (campo === 'rutaRecurso') {
          throw new ConflictException('Ya existe un recurso con esa ruta.');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para inactivar un recurso por su id
  async inactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.recurso.update({
      where: { id },
      data: {
        estado: false,
      },
    });
  }

  //Funcion para reactivar un recurso por su id
  async reactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.recurso.update({
      where: { id },
      data: {
        estado: true,
      },
    });
  }

}