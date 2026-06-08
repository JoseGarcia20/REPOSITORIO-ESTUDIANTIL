import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { AuditoriaService } from '../../auditoria/servicios/auditoria.service';
import { CrearCalificacionUsoIaDto } from '../dto/crear-calificacion-uso-ia.dto';

@Injectable()
export class CalificacionUsoIaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async crear(data: CrearCalificacionUsoIaDto, usuarioAuth: any) {
    const usuarioId = Number(usuarioAuth?.sub);

    if (!usuarioId) {
      throw new BadRequestException('No se pudo identificar el usuario.');
    }

    const registro = await this.prisma.calificacionUsoIa.create({
      data: {
        modulo: data.modulo.trim(),
        funcionalidad: data.funcionalidad.trim(),
        entidadTipo: data.entidadTipo?.trim() || null,
        entidadId: data.entidadId ? Number(data.entidadId) : null,
        calificacion: Number(data.calificacion),
        comentario: data.comentario?.trim() || null,
        metadata: (data.metadata || null) as any,
        usuarioId,
        institucionId: Number(usuarioAuth?.institucionId) || null,
      },
    });

    await this.auditoriaService.registrar(
      {
        entidad: 'calificacion_uso_ia',
        entidadId: registro.id,
        accion: 'calificar_ia',
        detalles: {
          modulo: registro.modulo,
          funcionalidad: registro.funcionalidad,
          entidadTipo: registro.entidadTipo,
          entidadId: registro.entidadId,
          calificacion: registro.calificacion,
        },
      },
      usuarioAuth,
    );

    return registro;
  }
}
