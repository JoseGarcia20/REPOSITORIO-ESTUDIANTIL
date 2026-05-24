import { Body, Controller, Get, Post, Req } from '@nestjs/common';
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
}
