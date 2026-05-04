import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { UsuarioService } from '../servicios/usuario.service';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('usuarios')
export class UsuarioController {

  constructor(private readonly usuarioService: UsuarioService) {}

  //Endpoint para la creacion de un nuevo usuario
  @Post()
  async crear(@Body() body: CrearUsuarioDto, @Req() req: any) {
    return await this.usuarioService.crear(body, req.usuarioAuth);
  }

  //Endpoint para listar todos los usuarios activos
  @Get()
  async listar(@Req() req: any) {
    return await this.usuarioService.listar(req.usuarioAuth);
  }

  //Endpoint para listar todos los usuarios, incluyendo los inactivos
  @Get('todos')
  async listarTodos(@Req() req: any) {
    return await this.usuarioService.listarTodos(req.usuarioAuth);
  }

  //Endpoint para obtener un usuario por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.usuarioService.obtenerPorId(Number(id), req.usuarioAuth);
  }

  //Endpoint para actualizar un usuario por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarUsuarioDto,
    @Req() req: any,
  ) {
    return await this.usuarioService.actualizar(id, body, req.usuarioAuth);
  }

  //Endpoint para inactivar un usuario por su id
  @Patch(':id/inactivar')
  async inactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.usuarioService.inactivar(id, req.usuarioAuth);
  }

  //Endpoint para reactivar un usuario por su id
  @Patch(':id/reactivar')
  async reactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.usuarioService.reactivar(id, req.usuarioAuth);
  }

}
