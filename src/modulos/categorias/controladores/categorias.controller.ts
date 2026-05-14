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
import { CategoriasService } from '../servicios/categorias.service';
import { CrearCategoriasDto } from '../dto/crear-categorias.dto';
import { ActualizarCategoriasDto } from '../dto/actualizar-categorias.dto';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Post()
  @RequierePermisos(PERMISOS.CATEGORIAS_CREAR)
  async crear(@Body() body: CrearCategoriasDto, @Req() req: any) {
    return await this.categoriasService.crear(body, req.usuarioAuth);
  }

  @Get()
  @RequierePermisos(PERMISOS.CATEGORIAS_VER)
  async listar(@Req() req: any) {
    return await this.categoriasService.listar(req.usuarioAuth);
  }

  @Get('todas')
  @RequierePermisos(PERMISOS.CATEGORIAS_VER)
  async listarTodas(@Req() req: any) {
    return await this.categoriasService.listarTodas(req.usuarioAuth);
  }

  @Get(':id')
  @RequierePermisos(PERMISOS.CATEGORIAS_VER)
  async obtenerPorId(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.categoriasService.obtenerPorId(Number(id), req.usuarioAuth);
  }

  @Put(':id')
  @RequierePermisos(PERMISOS.CATEGORIAS_EDITAR)
  async actualizar(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: ActualizarCategoriasDto,
    @Req() req: any,
  ) {
    return await this.categoriasService.actualizar(
      Number(id),
      body,
      req.usuarioAuth,
    );
  }

  @Patch(':id/inactivar')
  @RequierePermisos(PERMISOS.CATEGORIAS_CAMBIAR_ESTADO)
  async inactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.categoriasService.inactivar(Number(id), req.usuarioAuth);
  }

  @Patch(':id/reactivar')
  @RequierePermisos(PERMISOS.CATEGORIAS_CAMBIAR_ESTADO)
  async reactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.categoriasService.reactivar(Number(id), req.usuarioAuth);
  }
}
