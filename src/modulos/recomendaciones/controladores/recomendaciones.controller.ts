import { Controller, Get, Query, Req } from '@nestjs/common';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';
import { ConsultaRecomendacionRecursosDto } from '../dto/consulta-recomendacion-recursos.dto';
import { RecomendacionesService } from '../servicios/recomendaciones.service';

@Controller('recomendaciones')
export class RecomendacionesController {
  constructor(
    private readonly recomendacionesService: RecomendacionesService,
  ) {}

  @Get('recursos')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async recomendarRecursos(
    @Query() query: ConsultaRecomendacionRecursosDto,
    @Req() req: any,
  ) {
    return await this.recomendacionesService.recomendarRecursos(
      query,
      req.usuarioAuth,
    );
  }
}
