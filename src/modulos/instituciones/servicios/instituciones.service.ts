import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';

@Injectable()
export class InstitucionesService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para la creacion de una nueva institucion
  async crear(data: any) {
    return await this.prisma.institucion.create({
      data,
    });
  }

  //Funcion para listar todas las instituciones
  async listar() {
    return await this.prisma.institucion.findMany({
      orderBy: {
        id: 'desc',
      },
    });
  }

  //Funcion para obtener una institucion por su id
  async obtenerPorId(id: number) {
    return await this.prisma.institucion.findUnique({
      where: { id },
    });
  }

  //Funcion para actualizar una institucion por su id
  async actualizar(id: number, data: any) {
    return await this.prisma.institucion.update({
      where: { id },
      data,
    });
  }

  //Funcion para inactivar una institucion por su id
  async inactivar(id: number) {
    return await this.prisma.institucion.update({
      where: { id },
      data: {
        estado: false,
      },
    });
  }

}