import { Controller, Get, Req } from '@nestjs/common';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';
import { DashboardService } from '../servicios/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumen')
  @RequierePermisos(PERMISOS.FOROS_VER)
  async obtenerResumen(@Req() req: any) {
    return await this.dashboardService.obtenerResumen(req.usuarioAuth);
  }
}
