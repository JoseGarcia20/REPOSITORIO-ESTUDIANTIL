import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { RolesService } from '../servicios/roles.service';
import { CrearRolesDto } from '../dto/crear-roles.dto';
import { ActualizarRolesDto } from '../dto/actualizar-roles.dto';

@Controller('roles')
export class RolesController {

  constructor(private readonly rolesService: RolesService) {}

  //Endpoint para la creacion de un nuevo rol
  @Post()
  async crear(@Body() body: CrearRolesDto) {
    return await this.rolesService.crear(body);
  }

  //Endpoint para listar todas los roles
  @Get()
  async listar() {
    return await this.rolesService.listar();
  }

  //Endpoint para listar todas los roles, incluyendo las inactivas
  @Get('todos')
  async listarTodos() {
    return await this.rolesService.listarTodos();
  }

  //Endpoint para obtener un rol por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: string) {
    return await this.rolesService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un rol por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: ActualizarRolesDto,
  ) {
    return await this.rolesService.actualizar(Number(id), body);
  }

  //Endpoint para inactivar un rol por su id
  @Patch(':id/inactivar')
  async inactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.rolesService.inactivar(Number(id));
  }

  //Endpoint para reactivar un rol por su id
  @Patch(':id/reactivar')
  async reactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.rolesService.reactivar(Number(id));
  }

}