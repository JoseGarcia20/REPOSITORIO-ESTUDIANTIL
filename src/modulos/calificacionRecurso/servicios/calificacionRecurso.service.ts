import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import {
  PERMISOS,
  tieneAccesoTotal,
  tienePermiso,
  validarPermiso,
} from '../../auth/utils/roles.util';
import { CalificarRecursoDto } from '../dto/calificar-recurso.dto';

@Injectable()
export class CalificacionRecursoService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarAccesoRecurso(recursoId: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_VER);

    const recurso = await this.prisma.recurso.findUnique({
      where: { id: recursoId },
      select: {
        id: true,
        estado: true,
        publicado: true,
        institucionId: true,
        gradoEscolarId: true,
      },
    });

    if (!recurso || !recurso.estado || !recurso.publicado) {
      throw new NotFoundException(`Recurso con id ${recursoId} no encontrado`);
    }

    if (!tieneAccesoTotal(usuarioAuth)) {
      if (recurso.institucionId !== Number(usuarioAuth?.institucionId)) {
        throw new ForbiddenException(
          'No tiene permisos para calificar recursos de otra institución',
        );
      }

      if (
        !tienePermiso(usuarioAuth, PERMISOS.RECURSOS_VER_TODOS_GRADOS) &&
        recurso.gradoEscolarId !== Number(usuarioAuth?.gradoEscolarId)
      ) {
        throw new ForbiddenException(
          'No tiene permisos para calificar recursos de otro grado escolar',
        );
      }
    }

    return recurso;
  }

  async calificar(recursoId: number, data: CalificarRecursoDto, usuarioAuth: any) {
    await this.validarAccesoRecurso(recursoId, usuarioAuth);
    const usuarioId = Number(usuarioAuth?.sub);

    return await this.prisma.calificacionRecurso.upsert({
      where: {
        usuarioId_recursoId: {
          usuarioId,
          recursoId,
        },
      },
      update: {
        calificacion: data.calificacion,
        comentario: data.comentario,
        estado: true,
      },
      create: {
        calificacion: data.calificacion,
        comentario: data.comentario,
        usuarioId,
        recursoId,
      },
    });
  }

  async obtenerResumen(recursoId: number, usuarioAuth: any) {
    await this.validarAccesoRecurso(recursoId, usuarioAuth);
    const usuarioId = Number(usuarioAuth?.sub);

    const [agregado, miCalificacion] = await Promise.all([
      this.prisma.calificacionRecurso.aggregate({
        where: {
          recursoId,
          estado: true,
        },
        _avg: {
          calificacion: true,
        },
        _count: {
          calificacion: true,
        },
      }),
      this.prisma.calificacionRecurso.findUnique({
        where: {
          usuarioId_recursoId: {
            usuarioId,
            recursoId,
          },
        },
      }),
    ]);

    return {
      promedio: agregado._avg.calificacion || 0,
      total: agregado._count.calificacion,
      miCalificacion: miCalificacion?.estado
        ? miCalificacion.calificacion
        : null,
    };
  }
}
