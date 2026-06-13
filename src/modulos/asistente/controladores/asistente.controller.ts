import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';
import { ConsultaAsistenteDto } from '../dto/consulta-asistente.dto';
import { AsistenteService } from '../servicios/asistente.service';
import { ConversacionService } from '../servicios/conversacion.service';

@Controller('asistente')
export class AsistenteController {
  constructor(
    private readonly asistenteService: AsistenteService,
    private readonly conversacionService: ConversacionService,
  ) {}

  @Post('chat')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async consultar(@Body() body: ConsultaAsistenteDto, @Req() req: any) {
    return await this.asistenteService.consultar(body, req.usuarioAuth);
  }

  @Get('conversaciones')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async listarConversaciones(@Req() req: any) {
    return this.conversacionService.listar(
      this.obtenerUsuarioId(req.usuarioAuth),
    );
  }

  @Get('conversaciones/:id')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async obtenerConversacion(@Param('id') id: string, @Req() req: any) {
    return this.conversacionService.obtenerUna(
      Number(id),
      this.obtenerUsuarioId(req.usuarioAuth),
    );
  }

  @Delete('conversaciones/:id')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async eliminarConversacion(@Param('id') id: string, @Req() req: any) {
    return this.conversacionService.eliminar(
      Number(id),
      this.obtenerUsuarioId(req.usuarioAuth),
    );
  }

  @Get('intereses')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async listarIntereses(@Req() req: any) {
    return this.conversacionService.obtenerIntereses(
      this.obtenerUsuarioId(req.usuarioAuth),
    );
  }

  private obtenerUsuarioId(usuarioAuth: any) {
    const usuarioId = Number(usuarioAuth?.id ?? usuarioAuth?.sub);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return usuarioId;
  }
}
