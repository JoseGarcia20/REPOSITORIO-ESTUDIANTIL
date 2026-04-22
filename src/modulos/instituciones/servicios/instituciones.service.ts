import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearInstitucionDto } from '../dto/crear-institucion.dto';
import { ActualizarInstitucionDto } from '../dto/actualizar-institucion.dto';

@Injectable()
export class InstitucionesService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de una nueva institucion
  async crear(data: CrearInstitucionDto) {
    try {
      return await this.prisma.institucion.create({
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

        if (campo === 'codigo') {
          throw new ConflictException('Ya existe una institución con ese código');
        }

        if (campo === 'nit') {
          throw new ConflictException('Ya existe una institución con ese NIT');
        }

        if (campo === 'correo') {
          throw new ConflictException('Ya existe una institución con ese correo');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para listar todas las instituciones
  async listar() {
    return await this.prisma.institucion.findMany({
      where: {
        estado: true, //Solo se listan las instituciones activas
      },
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar las instituciones mas recientes primero
      },
    });
  }

  //Funcion para listar todas las instituciones, incluyendo las inactivas
  async listarTodas() {
    return await this.prisma.institucion.findMany({
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar las instituciones mas recientes primero
      },
    });
  }

  //Funcion para obtener una institucion por su id
  async obtenerPorId(id: number) {
    const institucion = await this.prisma.institucion.findUnique({
      where: { id },
    });

    if (!institucion) {
      throw new NotFoundException(`Institucion con id ${id} no encontrada`);
    }

    return institucion;

  }

  //Funcion para actualizar una institucion por su id
  async actualizar(id: number, data: ActualizarInstitucionDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.institucion.update({
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

        if (campo === 'codigo') {
          throw new ConflictException('Ya existe una institución con ese código');
        }

        if (campo === 'nit') {
          throw new ConflictException('Ya existe una institución con ese NIT');
        }

        if (campo === 'correo') {
          throw new ConflictException('Ya existe una institución con ese correo');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para inactivar una institucion por su id
  async inactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.institucion.update({
      where: { id },
      data: {
        estado: false,
      },
    });
  }

  //Funcion para reactivar una institucion por su id
  async reactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.institucion.update({
      where: { id },
      data: {
        estado: true,
      },
    });
  }

}