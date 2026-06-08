import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';
import { GenerarReporteDto } from '../dto/generar-reporte.dto';
import { ReportesService } from '../servicios/reportes.service';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('catalogos')
  @RequierePermisos(PERMISOS.REPORTES_VER)
  async obtenerCatalogos(@Req() req: any) {
    return await this.reportesService.obtenerCatalogos(req.usuarioAuth);
  }

  @Post('generar')
  @RequierePermisos(PERMISOS.REPORTES_VER)
  async generar(@Body() body: GenerarReporteDto, @Req() req: any) {
    return await this.reportesService.generar(body, req.usuarioAuth);
  }

  @Post('generar-excel')
  @RequierePermisos(PERMISOS.REPORTES_VER)
  async generarExcel(
    @Body() body: GenerarReporteDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const archivo = await this.reportesService.generarExcel(
      body,
      req.usuarioAuth,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=reporte-${body.tipo}-${Date.now()}.xlsx`,
    );
    res.send(archivo);
  }
}
