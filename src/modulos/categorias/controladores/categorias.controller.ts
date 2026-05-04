import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CategoriasService } from '../servicios/categorias.service';
import { CrearCategoriasDto } from '../dto/crear-categorias.dto';
import { ActualizarCategoriasDto } from '../dto/actualizar-categorias.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}
  @Post() async crear(@Body() body: CrearCategoriasDto, @Req() req: any) { return await this.categoriasService.crear(body, req.usuarioAuth); }
  @Get() async listar(@Req() req: any) { return await this.categoriasService.listar(req.usuarioAuth); }
  @Get('todas') async listarTodas(@Req() req: any) { return await this.categoriasService.listarTodas(req.usuarioAuth); }
  @Get(':id') async obtenerPorId(@Param('id', ParseIntPipe) id: string, @Req() req: any) { return await this.categoriasService.obtenerPorId(Number(id), req.usuarioAuth); }
  @Put(':id') async actualizar(@Param('id', ParseIntPipe) id: string, @Body() body: ActualizarCategoriasDto, @Req() req: any) { return await this.categoriasService.actualizar(Number(id), body, req.usuarioAuth); }
  @Patch(':id/inactivar') async inactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) { return await this.categoriasService.inactivar(Number(id), req.usuarioAuth); }
  @Patch(':id/reactivar') async reactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) { return await this.categoriasService.reactivar(Number(id), req.usuarioAuth); }
}
