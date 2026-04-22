import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearCategoriasDto } from '../dto/crear-categorias.dto';
import { ActualizarCategoriasDto } from '../dto/actualizar-categorias.dto';

@Injectable()
export class CategoriasService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de una nueva categoria
  async crear(data: CrearCategoriasDto) {
    try {
      return await this.prisma.categoria.create({
        data: {
            nombre: data.nombre,
            descripcion: data.descripcion,
            color: data.color,
            institucionId: data.institucionId,
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
          throw new ConflictException('Ya existe una categoría con ese nombre');
        }

        if (campo === 'color') {
          throw new ConflictException('Ya existe una categoría con ese color');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para listar todas las categorias activas, ordenadas por id de forma descendente para mostrar las categorias mas recientes primero
  async listar() {
    return await this.prisma.categoria.findMany({
      where: {
        estado: true, //Solo se listan las categorias activas
      },
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar las categorias mas recientes primero
      },
    });
  }

  //Funcion para listar todas las categorias, incluyendo las inactivas
  async listarTodas() {
    return await this.prisma.categoria.findMany({
      orderBy: {
        id: 'desc', //Ordena por id de forma descendente para mostrar las categorias mas recientes primero
      },
    });
  }

  //Funcion para obtener una categoria por su id
  async obtenerPorId(id: number) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
    });

    if (!categoria) {
      throw new NotFoundException(`Categoria con id ${id} no encontrada`);
    }

    return categoria;

  }

  //Funcion para actualizar una categoria por su id
  async actualizar(id: number, data: ActualizarCategoriasDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.categoria.update({
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
          throw new ConflictException('Ya existe una categoría con ese nombre');
        }

        if (campo === 'color') {
          throw new ConflictException('Ya existe una categoría con ese color');
        }

        throw new ConflictException(`Ya existe un registro con el campo único: ${campo}`);
      }

      throw error;
    }
  }

  //Funcion para inactivar una categoria por su id
  async inactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.categoria.update({
      where: { id },
      data: {
        estado: false,
      },
    });
  }

  //Funcion para reactivar una categoria por su id
  async reactivar(id: number) {
    await this.obtenerPorId(id);

    return await this.prisma.categoria.update({
      where: { id },
      data: {
        estado: true,
      },
    });
  }

}