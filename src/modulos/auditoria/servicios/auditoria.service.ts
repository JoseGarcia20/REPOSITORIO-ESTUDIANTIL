import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import {
  PERMISOS,
  tieneAccesoTotal,
  validarPermiso,
} from '../../auth/utils/roles.util';
import {
  ConsultaPaginada,
  obtenerPaginacion,
  respuestaPaginada,
} from '../../../comun/paginacion';

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async limpiarLogsAntiguos() {
    const dosMesesAtras = new Date();
    dosMesesAtras.setMonth(dosMesesAtras.getMonth() - 2);

    try {
      const { count } = await this.prisma.auditoriaLog.deleteMany({
        where: { createdAt: { lt: dosMesesAtras } },
      });
      if (count > 0) {
        this.logger.log(`Auditoría: ${count} registros anteriores a 2 meses eliminados`);
      }
    } catch (error) {
      this.logger.error('Error al limpiar registros antiguos de auditoría', error);
    }
  }

  async registrar(
    params: {
      entidad: string;
      entidadId?: number;
      accion: string;
      detalles?: Record<string, unknown>;
      institucionId?: number;
    },
    usuarioAuth: any,
  ) {
    const usuarioId = Number(usuarioAuth?.sub);
    if (!usuarioId) return;

    await this.prisma.auditoriaLog.create({
      data: {
        entidad: params.entidad,
        entidadId: params.entidadId,
        accion: params.accion,
        usuarioId,
        institucionId: params.institucionId ?? (Number(usuarioAuth?.institucionId) || null),
        detalles: params.detalles as any,
        direccionIp: usuarioAuth?.ip || null,
      },
    }).catch(() => {});
  }

  async listar(usuarioAuth: any, query: ConsultaPaginada & {
    entidad?: string;
    entidadId?: string;
  }) {
    validarPermiso(usuarioAuth, PERMISOS.AUDITORIA_VER);
    const { pagina, limite, skip } = obtenerPaginacion(query);

    const where: Record<string, unknown> = {};

    if (!tieneAccesoTotal(usuarioAuth)) {
      where.institucionId = Number(usuarioAuth?.institucionId);
    }

    if (query.entidad) {
      where.entidad = query.entidad;
    }

    if (query.entidadId) {
      where.entidadId = Number(query.entidadId);
    }

    where.createdAt = {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditoriaLog.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
              correo: true,
            },
          },
          institucion: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
        orderBy: { id: 'desc' },
        skip,
        take: limite,
      }),
      this.prisma.auditoriaLog.count({ where }),
    ]);

    return respuestaPaginada(data, total, pagina, limite);
  }

  async exportarExcel(usuarioAuth: any, query: {
    entidad?: string;
    entidadId?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }) {
    validarPermiso(usuarioAuth, PERMISOS.AUDITORIA_VER);

    const where: Record<string, unknown> = {};

    if (!tieneAccesoTotal(usuarioAuth)) {
      where.institucionId = Number(usuarioAuth?.institucionId);
    }

    if (query.entidad) {
      where.entidad = query.entidad;
    }

    if (query.entidadId) {
      where.entidadId = Number(query.entidadId);
    }

    const fechaInicio = query.fechaInicio
      ? new Date(query.fechaInicio)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fechaFin = query.fechaFin ? new Date(query.fechaFin) : new Date();

    where.createdAt = {
      gte: fechaInicio,
      lte: fechaFin,
    };

    return await this.prisma.auditoriaLog.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            correo: true,
          },
        },
        institucion: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }
}
