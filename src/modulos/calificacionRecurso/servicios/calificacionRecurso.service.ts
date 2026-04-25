import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearCalificacionRecursoDto } from '../dto/crear-calificacionRecurso.dto';
import { ActualizarCalificacionRecursoDto } from '../dto/actualizar-calificacionRecurso.dto';

@Injectable()
export class CalificacionRecursoService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de un nuevo CR
  async crear(data: CrearCalificacionRecursoDto) {
    try {
      return await this.prisma.calificacionRecurso.create({
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

  //Funcion para listar todas los CR activos, ordenados por id de forma descendente para mostrar los usuarios mas recientes primero
  async listar() {
    return await this.prisma.calificacionRecurso.findMany({
      where: {
        estado: true, //Solo se listan los CR activos
      },
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los CR mas recientes primero
      },
    });
  }

  //Funcion para listar todas los CR, incluyendo los inactivos
  async listarTodos() {
    return await this.prisma.calificacionRecurso.findMany({
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los CR mas recientes primero
      },
    });
  }

  //Funcion para obtener un CR por su id
  async obtenerPorId(id: number) {
    const calificacionRecurso = await this.prisma.calificacionRecurso.findUnique({
      where: { id },
    });

    if (!calificacionRecurso) {
      throw new NotFoundException(`CR con id ${id} no encontrado`);
    }

    return calificacionRecurso;

  }

  //Funcion para actualizar un foro por su id
  async actualizar(id: number, data: ActualizarCalificacionRecursoDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.calificacionRecurso.update({
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

  //Funcion para inactivar un CR por su id
  async inactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.calificacionRecurso.update({
      where: { id },
      data: {
        estado: false,
      },
    });
  }

  //Funcion para reactivar un CA por su id
  async reactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.calificacionRecurso.update({
      where: { id },
      data: {
        estado: true,
      },
    });
  }

}