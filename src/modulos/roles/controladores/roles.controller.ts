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
import { RolesService } from '../servicios/roles.service';
import { CrearRolesDto } from '../dto/crear-roles.dto';
import { ActualizarRolesDto } from '../dto/actualizar-roles.dto';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequierePermisos(PERMISOS.ROLES_CREAR)
  async crear(@Body() body: CrearRolesDto, @Req() req: any) {
    return await this.rolesService.crear(body, req.usuarioAuth);
  }

  @Get()
  @RequierePermisos(PERMISOS.ROLES_VER)
  async listar(@Req() req: any) {
    return await this.rolesService.listar(req.usuarioAuth);
  }

  @Get('todos')
  @RequierePermisos(PERMISOS.ROLES_VER)
  async listarTodos(@Req() req: any) {
    return await this.rolesService.listarTodos(req.usuarioAuth);
  }

  @Get('asignables')
  @RequierePermisos(
    PERMISOS.USUARIOS_CREAR,
    PERMISOS.USUARIOS_EDITAR,
    PERMISOS.ROLES_VER,
  )
  async listarAsignables(@Req() req: any) {
    return await this.rolesService.listarAsignables(req.usuarioAuth);
  }

  @Get(':id')
  @RequierePermisos(PERMISOS.ROLES_VER)
  async obtenerPorId(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.rolesService.obtenerPorId(Number(id), req.usuarioAuth);
  }

  @Put(':id')
  @RequierePermisos(PERMISOS.ROLES_EDITAR)
  async actualizar(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: ActualizarRolesDto,
    @Req() req: any,
  ) {
    return await this.rolesService.actualizar(Number(id), body, req.usuarioAuth);
  }

  @Patch(':id/inactivar')
  @RequierePermisos(PERMISOS.ROLES_CAMBIAR_ESTADO)
  async inactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.rolesService.inactivar(Number(id), req.usuarioAuth);
  }

  @Patch(':id/reactivar')
  @RequierePermisos(PERMISOS.ROLES_CAMBIAR_ESTADO)
  async reactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.rolesService.reactivar(Number(id), req.usuarioAuth);
  }
}
