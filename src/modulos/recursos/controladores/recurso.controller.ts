import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { RecursoService } from '../servicios/recurso.service';
import { CrearRecursoDto } from '../dto/crear-recurso.dto';
import { ActualizarRecursoDto } from '../dto/actualizar-recurso.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('recursos')
export class RecursoController {
  constructor(private readonly recursoService: RecursoService) {}
  @Post() async crear(@Body() body: CrearRecursoDto, @Req() req: any) { return await this.recursoService.crear(body, req.usuarioAuth); }
  @Get() async listar(@Req() req: any) { return await this.recursoService.listar(req.usuarioAuth); }
  @Get('todos') async listarTodos(@Req() req: any) { return await this.recursoService.listarTodos(req.usuarioAuth); }
  @Get(':id') async obtenerPorId(@Param('id', ParseIntPipe) id: number, @Req() req: any) { return await this.recursoService.obtenerPorId(Number(id), req.usuarioAuth); }
  @Put(':id') async actualizar(@Param('id', ParseIntPipe) id: number, @Body() body: ActualizarRecursoDto, @Req() req: any) { return await this.recursoService.actualizar(id, body, req.usuarioAuth); }
  @Patch(':id/inactivar') async inactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) { return await this.recursoService.inactivar(id, req.usuarioAuth); }
  @Patch(':id/reactivar') async reactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) { return await this.recursoService.reactivar(id, req.usuarioAuth); }
}
