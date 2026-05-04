import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { TiposRecursosService } from '../servicios/tiposRecursos.service';
import { CrearTiposRecursosDto } from '../dto/crear-tiposRecursos';
import { ActualizarTiposRecursosDto } from '../dto/actualizar-tiposRecursos';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tipos-recursos')
export class TiposRecursosController {
  constructor(private readonly tiposRecursosService: TiposRecursosService) {}
  @Post() async crear(@Body() body: CrearTiposRecursosDto, @Req() req: any) { return await this.tiposRecursosService.crear(body, req.usuarioAuth); }
  @Get() async listar(@Req() req: any) { return await this.tiposRecursosService.listar(req.usuarioAuth); }
  @Get('todos') async listarTodos(@Req() req: any) { return await this.tiposRecursosService.listarTodos(req.usuarioAuth); }
  @Get(':id') async obtenerPorId(@Param('id', ParseIntPipe) id: string, @Req() req: any) { return await this.tiposRecursosService.obtenerPorId(Number(id), req.usuarioAuth); }
  @Put(':id') async actualizar(@Param('id', ParseIntPipe) id: string, @Body() body: ActualizarTiposRecursosDto, @Req() req: any) { return await this.tiposRecursosService.actualizar(Number(id), body, req.usuarioAuth); }
  @Patch(':id/inactivar') async inactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) { return await this.tiposRecursosService.inactivar(Number(id), req.usuarioAuth); }
  @Patch(':id/reactivar') async reactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) { return await this.tiposRecursosService.reactivar(Number(id), req.usuarioAuth); }
}
