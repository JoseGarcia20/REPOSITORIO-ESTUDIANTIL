import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearTiposRecursosDto } from '../dto/crear-tiposRecursos';
import { ActualizarTiposRecursosDto } from '../dto/actualizar-tiposRecursos';

@Injectable()
export class TiposRecursosService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de un nuevo tipo de recursos
  async crear(data: CrearTiposRecursosDto) {
    try {
      return await this.prisma.tipoRecurso.create({
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          icono: data.icono,
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
          throw new ConflictException('Ya existe un tipo de recurso con ese nombre');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para listar todos los tipos de recursos activos
  async listar() {
    return await this.prisma.tipoRecurso.findMany({
      where: {
        estado: true, //Solo se listan los tipos de recursos activos
      },
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los tipos de recursos mas recientes primero
      },
    });
  }

  //Funcion para listar todos los tipos de recursos, incluyendo los inactivos
  async listarTodos() {
    return await this.prisma.tipoRecurso.findMany({
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los tipos de recursos mas recientes primero
      },
    });
  }

  //Funcion para obtener un tipo de recurso por su id
  async obtenerPorId(id: number) {
    const tipoRecurso = await this.prisma.tipoRecurso.findUnique({
      where: { id },
    });

    if (!tipoRecurso) {
      throw new NotFoundException(`Tipo de recurso con id ${id} no encontrado`);
    }

    return tipoRecurso;
  }

  //Funcion para actualizar un tipo de recurso por su id
  async actualizar(id: number, data: ActualizarTiposRecursosDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.tipoRecurso.update({
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
          throw new ConflictException('Ya existe un tipo de recurso con ese nombre');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para inactivar un tipo de recurso por su id
  async inactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.tipoRecurso.update({
      where: { id },
      data: {
        estado: false,
      },
    });
  }

  //Funcion para reactivar un tipo de recurso por su id
  async reactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.tipoRecurso.update({
      where: { id },
      data: {
        estado: true,
      },
    });
  }

}