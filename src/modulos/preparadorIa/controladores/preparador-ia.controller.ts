import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';
import { GenerarMaterialIaDto } from '../dto/generar-material-ia.dto';
import { GuardarMaterialIaDto } from '../dto/guardar-material-ia.dto';
import { PreparadorIaService } from '../servicios/preparador-ia.service';

@Controller('preparador-ia')
export class PreparadorIaController {
  constructor(private readonly preparadorIaService: PreparadorIaService) {}

  @Get('catalogos')
  @RequierePermisos(PERMISOS.PREPARADOR_IA_USAR)
  async obtenerCatalogos(@Req() req: any) {
    return await this.preparadorIaService.obtenerCatalogos(req.usuarioAuth);
  }

  @Post('generar')
  @RequierePermisos(PERMISOS.PREPARADOR_IA_USAR)
  async generar(@Body() body: GenerarMaterialIaDto, @Req() req: any) {
    return await this.preparadorIaService.generarMaterial(
      body,
      req.usuarioAuth,
    );
  }

  @Post('guardar')
  @RequierePermisos(PERMISOS.PREPARADOR_IA_USAR)
  async guardar(@Body() body: GuardarMaterialIaDto, @Req() req: any) {
    return await this.preparadorIaService.guardarMaterial(
      body,
      req.usuarioAuth,
    );
  }
}
