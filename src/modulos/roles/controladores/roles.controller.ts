import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { RolesService } from '../servicios/roles.service';
import { CrearRolesDto } from '../dto/crear-roles.dto';
import { ActualizarRolesDto } from '../dto/actualizar-roles.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}
  @Post() async crear(@Body() body: CrearRolesDto, @Req() req: any) { return await this.rolesService.crear(body, req.usuarioAuth); }
  @Get() async listar(@Req() req: any) { return await this.rolesService.listar(req.usuarioAuth); }
  @Get('todos') async listarTodos(@Req() req: any) { return await this.rolesService.listarTodos(req.usuarioAuth); }
  @Get('asignables') async listarAsignables(@Req() req: any) { return await this.rolesService.listarAsignables(req.usuarioAuth); }
  @Get(':id') async obtenerPorId(@Param('id', ParseIntPipe) id: string, @Req() req: any) { return await this.rolesService.obtenerPorId(Number(id), req.usuarioAuth); }
  @Put(':id') async actualizar(@Param('id', ParseIntPipe) id: string, @Body() body: ActualizarRolesDto, @Req() req: any) { return await this.rolesService.actualizar(Number(id), body, req.usuarioAuth); }
  @Patch(':id/inactivar') async inactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) { return await this.rolesService.inactivar(Number(id), req.usuarioAuth); }
  @Patch(':id/reactivar') async reactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) { return await this.rolesService.reactivar(Number(id), req.usuarioAuth); }
}
