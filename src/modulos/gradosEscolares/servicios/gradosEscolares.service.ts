import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';

@Injectable()
export class GradosEscolaresService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return await this.prisma.gradoEscolar.findMany({
      where: {
        estado: true,
      },
      orderBy: {
        orden: 'asc',
      },
    });
  }
}
