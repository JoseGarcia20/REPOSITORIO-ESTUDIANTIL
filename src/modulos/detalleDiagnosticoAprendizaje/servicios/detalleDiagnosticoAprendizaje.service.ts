import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearDetalleDiagnosticoAprendizajeDto } from '../dto/crear-detalleDiagnosticoAprendizaje.dto.';
import { ActualizarDetalleDiagnosticoAprendizajeDto } from '../dto/actualizar-detalleDiagnosticoAprendizaje.dto';

@Injectable()
export class DetalleDiagnosticoAprendizajeService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de un nuevo DA, con manejo de errores para campos únicos
  async crear(data: CrearDetalleDiagnosticoAprendizajeDto) {
    try {
      return await this.prisma.detalleDiagnosticoAprendizaje.create({
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

  //Funcion para listar todos los DRA activos, ordenados por id de forma descendente para mostrar los usuarios mas recientes primero
  async listar() {
    return await this.prisma.detalleDiagnosticoAprendizaje.findMany({
      where: {
      },
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los DA mas recientes primero
      },
    });
  }

  //Funcion para listar todas los RA, incluyendo los inactivos
  async listarTodos() {
    return await this.prisma.detalleDiagnosticoAprendizaje.findMany({
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar los DA mas recientes primero
      },
    });
  }

  //Funcion para obtener un usuario por su id
  async obtenerPorId(id: number) {
    const detalleDiagnosticoAprendizaje = await this.prisma.detalleDiagnosticoAprendizaje.findUnique({
      where: { id },
    });

    if (!detalleDiagnosticoAprendizaje) {
      throw new NotFoundException(`Detalle Diagnostico Aprendizaje con id ${id} no encontrado`);
    }

    return detalleDiagnosticoAprendizaje;

  }

  //Funcion para actualizar un DA por su id
  async actualizar(id: number, data: ActualizarDetalleDiagnosticoAprendizajeDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.detalleDiagnosticoAprendizaje.update({
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