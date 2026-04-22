import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { UsuarioService } from '../servicios/usuario.service';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';

@Controller('usuarios')
export class UsuarioController {

  constructor(private readonly usuarioService: UsuarioService) {}

  //Endpoint para la creacion de un nuevo usuario
  @Post()
  async crear(@Body() body: CrearUsuarioDto) {
    return await this.usuarioService.crear(body);
  }

  //Endpoint para listar todos los usuarios activos
  @Get()
  async listar() {
    return await this.usuarioService.listar();
  }

  //Endpoint para listar todos los usuarios, incluyendo los inactivos
  @Get('todos')
  async listarTodos() {
    return await this.usuarioService.listarTodos();
  }

  //Endpoint para obtener un usuario por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return await this.usuarioService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un usuario por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarUsuarioDto,
  ) {
    return await this.usuarioService.actualizar(id, body);
  }

  //Endpoint para inactivar un usuario por su id
  @Patch(':id/inactivar')
  async inactivar(@Param('id', ParseIntPipe) id: number) {
    return await this.usuarioService.inactivar(id);
  }

  //Endpoint para reactivar un usuario por su id
  @Patch(':id/reactivar')
  async reactivar(@Param('id', ParseIntPipe) id: number) {
    return await this.usuarioService.reactivar(id);
  }

}