import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ForoService } from '../servicios/foro.service';
import { CrearForoDto } from '../dto/crear-foro.dto';
import { ActualizarForoDto } from '../dto/actualizar-foro.dto';
import { CrearComentarioForoDto } from '../dto/crear-comentario-foro.dto';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

@Controller('foros')
export class ForoController {
  constructor(private readonly foroService: ForoService) {}

  @Post()
  @RequierePermisos(PERMISOS.FOROS_CREAR)
  async crear(@Body() body: CrearForoDto, @Req() req: any) {
    return await this.foroService.crear(body, req.usuarioAuth);
  }

  @Get()
  @RequierePermisos(PERMISOS.FOROS_VER)
  async listar(@Req() req: any, @Query() query: any) {
    return await this.foroService.listar(req.usuarioAuth, query);
  }

  @Get('todos')
  @RequierePermisos(PERMISOS.FOROS_VER)
  async listarTodos(@Req() req: any, @Query() query: any) {
    return await this.foroService.listarTodos(req.usuarioAuth, query);
  }

  @Get('categorias')
  @RequierePermisos(PERMISOS.FOROS_CREAR)
  async listarCategoriasParaForo(@Req() req: any) {
    return await this.foroService.listarCategoriasParaForo(req.usuarioAuth);
  }

  @Get(':id')
  @RequierePermisos(PERMISOS.FOROS_VER)
  async obtenerPorId(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.foroService.obtenerPorId(Number(id), req.usuarioAuth);
  }

  @Put(':id')
  @RequierePermisos(PERMISOS.FOROS_CREAR)
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarForoDto,
    @Req() req: any,
  ) {
    return await this.foroService.actualizar(id, body, req.usuarioAuth);
  }

  @Patch(':id/cerrar')
  @RequierePermisos(PERMISOS.FOROS_CERRAR)
  async cerrar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.foroService.cerrar(id, req.usuarioAuth);
  }

  @Patch(':id/inactivar')
  @RequierePermisos(PERMISOS.FOROS_CREAR)
  async inactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.foroService.inactivar(id, req.usuarioAuth);
  }

  @Patch(':id/reactivar')
  @RequierePermisos(PERMISOS.FOROS_CREAR)
  async reactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.foroService.reactivar(id, req.usuarioAuth);
  }

  @Post(':id/comentarios')
  @RequierePermisos(PERMISOS.FOROS_COMENTAR)
  async comentar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CrearComentarioForoDto,
    @Req() req: any,
  ) {
    return await this.foroService.comentar(id, body, req.usuarioAuth);
  }
}
