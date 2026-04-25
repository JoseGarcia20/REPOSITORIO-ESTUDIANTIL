import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearDiagnosticoAprendizajeDto } from '../dto/crear-diagnosticoAprendizaje.dto';
import { ActualizarDiagnosticoAprendizajeDto } from '../dto/actualizar-diagnosticoAprendizaje.dto';

@Injectable()
export class DiagnosticoAprendizajeService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de un nuevo diagnostico de aprendizaje
  async crear(data: CrearDiagnosticoAprendizajeDto) {
    try {
      return await this.prisma.diagnosticoAprendizaje.create({
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

  //Funcion para listar todos los diagnosticos de aprendizaje activos, ordenados por id de forma descendente para mostrar los usuarios mas recientes primero
  async listar() {
    return await this.prisma.diagnosticoAprendizaje.findMany({
      where: {
      },
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los DA mas recientes primero
      },
    });
  }

  //Funcion para listar todas los DA, incluyendo los inactivos
  async listarTodos() {
    return await this.prisma.diagnosticoAprendizaje.findMany({
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los DA mas recientes primero
      },
    });
  }

  //Funcion para obtener un usuario por su id
  async obtenerPorId(id: number) {
    const diagnosticoAprendizaje = await this.prisma.diagnosticoAprendizaje.findUnique({
      where: { id },
    });

    if (!diagnosticoAprendizaje) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return diagnosticoAprendizaje;

  }

  //Funcion para actualizar un DA por su id
  async actualizar(id: number, data: ActualizarDiagnosticoAprendizajeDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.diagnosticoAprendizaje.update({
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

}