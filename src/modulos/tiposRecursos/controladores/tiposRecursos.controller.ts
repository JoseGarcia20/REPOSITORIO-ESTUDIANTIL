import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { TiposRecursosService } from '../servicios/tiposRecursos.service';
import { CrearTiposRecursosDto } from '../dto/crear-tiposRecursos';
import { ActualizarTiposRecursosDto } from '../dto/actualizar-tiposRecursos';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

@Controller('tipos-recursos')
export class TiposRecursosController {
  constructor(private readonly tiposRecursosService: TiposRecursosService) {}

  @Post()
  @RequierePermisos(PERMISOS.TIPOS_RECURSOS_CREAR)
  async crear(@Body() body: CrearTiposRecursosDto, @Req() req: any) {
    return await this.tiposRecursosService.crear(body, req.usuarioAuth);
  }

  @Get()
  @RequierePermisos(PERMISOS.TIPOS_RECURSOS_VER)
  async listar(@Req() req: any) {
    return await this.tiposRecursosService.listar(req.usuarioAuth);
  }

  @Get('todos')
  @RequierePermisos(PERMISOS.TIPOS_RECURSOS_VER)
  async listarTodos(@Req() req: any) {
    return await this.tiposRecursosService.listarTodos(req.usuarioAuth);
  }

  @Get(':id')
  @RequierePermisos(PERMISOS.TIPOS_RECURSOS_VER)
  async obtenerPorId(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.tiposRecursosService.obtenerPorId(
      Number(id),
      req.usuarioAuth,
    );
  }

  @Put(':id')
  @RequierePermisos(PERMISOS.TIPOS_RECURSOS_EDITAR)
  async actualizar(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: ActualizarTiposRecursosDto,
    @Req() req: any,
  ) {
    return await this.tiposRecursosService.actualizar(
      Number(id),
      body,
      req.usuarioAuth,
    );
  }

  @Patch(':id/inactivar')
  @RequierePermisos(PERMISOS.TIPOS_RECURSOS_CAMBIAR_ESTADO)
  async inactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.tiposRecursosService.inactivar(Number(id), req.usuarioAuth);
  }

  @Patch(':id/reactivar')
  @RequierePermisos(PERMISOS.TIPOS_RECURSOS_CAMBIAR_ESTADO)
  async reactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.tiposRecursosService.reactivar(Number(id), req.usuarioAuth);
  }
}
