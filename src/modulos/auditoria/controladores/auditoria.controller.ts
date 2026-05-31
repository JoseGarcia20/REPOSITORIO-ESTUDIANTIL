import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Response } from 'express';
import ExcelJS from 'exceljs';
import { AuditoriaService } from '../servicios/auditoria.service';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @RequierePermisos(PERMISOS.AUDITORIA_VER)
  async listar(@Req() req: any, @Query() query: any) {
    return await this.auditoriaService.listar(req.usuarioAuth, query);
  }

  @Get('exportar-excel')
  @RequierePermisos(PERMISOS.AUDITORIA_VER)
  async exportarExcel(@Req() req: any, @Query() query: any, @Res() res: Response) {
    const logs = await this.auditoriaService.exportarExcel(req.usuarioAuth, query);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Auditoría');

      const columnas: Partial<ExcelJS.Column>[] = [
        { header: 'ID', key: 'id', width: 16 },
        { header: 'Entidad', key: 'entidad', width: 22 },
        { header: 'ID Entidad', key: 'entidadId', width: 14 },
        { header: 'Acción', key: 'accion', width: 20 },
        { header: 'Usuario', key: 'usuario', width: 28 },
        { header: 'Correo', key: 'correo', width: 30 },
        { header: 'Institución', key: 'institucion', width: 24 },
        { header: 'Detalles', key: 'detalles', width: 40 },
        { header: 'Dirección IP', key: 'ip', width: 18 },
        { header: 'Fecha', key: 'fecha', width: 26 },
      ];

      worksheet.columns = columnas;

      const filas = logs.map((log) => ({
        id: log.id.toString(),
        entidad: log.entidad,
        entidadId: log.entidadId?.toString() || '',
        accion: log.accion,
        usuario: `${log.usuario.nombres} ${log.usuario.apellidos}`,
        correo: log.usuario.correo,
        institucion: log.institucion?.nombre || '',
        detalles: log.detalles ? JSON.stringify(log.detalles) : '',
        ip: log.direccionIp || '',
        fecha: log.createdAt.toISOString(),
      }));

      worksheet.addRows(filas);

      worksheet.getRow(1).font = { bold: true, size: 12 };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F2937' },
        bgColor: { argb: 'FFFFFFFF' },
      };
      worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=auditoria-${Date.now()}.xlsx`,
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch {
      throw new InternalServerErrorException('Error al generar el archivo Excel');
    }
  }
}
