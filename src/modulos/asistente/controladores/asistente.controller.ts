import { Body, Controller, Post, Req } from '@nestjs/common';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';
import { ConsultaAsistenteDto } from '../dto/consulta-asistente.dto';
import { AsistenteService } from '../servicios/asistente.service';

@Controller('asistente')
export class AsistenteController {
  constructor(private readonly asistenteService: AsistenteService) {}

  @Post('chat')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async consultar(@Body() body: ConsultaAsistenteDto, @Req() req: any) {
    return await this.asistenteService.consultar(body, req.usuarioAuth);
  }
}
