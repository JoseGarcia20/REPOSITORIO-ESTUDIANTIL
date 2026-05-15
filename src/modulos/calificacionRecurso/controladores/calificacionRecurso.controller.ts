import { Body, Controller, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';
import { CalificacionRecursoService } from '../servicios/calificacionRecurso.service';
import { CalificarRecursoDto } from '../dto/calificar-recurso.dto';

@Controller('calificacion-recurso')
export class CalificacionRecursoController {
  constructor(
    private readonly calificacionRecursoService: CalificacionRecursoService,
  ) {}

  @Get('recurso/:recursoId/resumen')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async obtenerResumen(
    @Param('recursoId', ParseIntPipe) recursoId: number,
    @Req() req: any,
  ) {
    return await this.calificacionRecursoService.obtenerResumen(
      recursoId,
      req.usuarioAuth,
    );
  }

  @Post('recurso/:recursoId')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async calificar(
    @Param('recursoId', ParseIntPipe) recursoId: number,
    @Body() body: CalificarRecursoDto,
    @Req() req: any,
  ) {
    return await this.calificacionRecursoService.calificar(
      recursoId,
      body,
      req.usuarioAuth,
    );
  }
}
