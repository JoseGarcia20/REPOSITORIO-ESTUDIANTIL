import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { UsuarioService } from '../servicios/usuario.service';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

@Controller('usuarios')
export class UsuarioController {

  constructor(private readonly usuarioService: UsuarioService) {}

  //Endpoint para la creacion de un nuevo usuario
  @Post()
  @RequierePermisos(PERMISOS.USUARIOS_CREAR)
  async crear(@Body() body: CrearUsuarioDto, @Req() req: any) {
    return await this.usuarioService.crear(body, req.usuarioAuth);
  }

  //Endpoint para listar todos los usuarios activos
  @Get()
  @RequierePermisos(PERMISOS.USUARIOS_VER)
  async listar(@Req() req: any, @Query() query: any) {
    return await this.usuarioService.listar(req.usuarioAuth, query);
  }

  //Endpoint para listar todos los usuarios, incluyendo los inactivos
  @Get('todos')
  @RequierePermisos(PERMISOS.USUARIOS_VER)
  async listarTodos(@Req() req: any, @Query() query: any) {
    return await this.usuarioService.listarTodos(req.usuarioAuth, query);
  }

  //Endpoint para obtener un usuario por su id
  @Get(':id')
  @RequierePermisos(PERMISOS.USUARIOS_VER)
  async obtenerPorId(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.usuarioService.obtenerPorId(Number(id), req.usuarioAuth);
  }

  //Endpoint para actualizar un usuario por su id
  @Put(':id')
  @RequierePermisos(PERMISOS.USUARIOS_EDITAR)
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarUsuarioDto,
    @Req() req: any,
  ) {
    return await this.usuarioService.actualizar(id, body, req.usuarioAuth);
  }

  //Endpoint para inactivar un usuario por su id
  @Patch(':id/inactivar')
  @RequierePermisos(PERMISOS.USUARIOS_CAMBIAR_ESTADO)
  async inactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.usuarioService.inactivar(id, req.usuarioAuth);
  }

  //Endpoint para reactivar un usuario por su id
  @Patch(':id/reactivar')
  @RequierePermisos(PERMISOS.USUARIOS_CAMBIAR_ESTADO)
  async reactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.usuarioService.reactivar(id, req.usuarioAuth);
  }

}
