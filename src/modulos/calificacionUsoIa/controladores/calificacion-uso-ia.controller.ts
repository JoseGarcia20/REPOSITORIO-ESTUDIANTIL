import { Body, Controller, Post, Req } from '@nestjs/common';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';
import { CrearCalificacionUsoIaDto } from '../dto/crear-calificacion-uso-ia.dto';
import { CalificacionUsoIaService } from '../servicios/calificacion-uso-ia.service';

@Controller('calificaciones-ia')
export class CalificacionUsoIaController {
  constructor(private readonly calificacionUsoIaService: CalificacionUsoIaService) {}

  @Post()
  @RequierePermisos(
    PERMISOS.RECURSOS_VER,
    PERMISOS.FOROS_VER,
    PERMISOS.PREPARADOR_IA_USAR,
  )
  async crear(@Body() body: CrearCalificacionUsoIaDto, @Req() req: any) {
    return await this.calificacionUsoIaService.crear(body, req.usuarioAuth);
  }
}
