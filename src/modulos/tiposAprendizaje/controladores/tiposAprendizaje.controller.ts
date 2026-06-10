import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { TiposAprendizajeService } from '../servicios/tiposAprendizaje.service';
import { CrearTiposAprendizajeDto } from '../dto/crear-tiposAprendizaje';
import { ActualizarTiposAprendizajeDto } from '../dto/actualizar-tiposAprendizaje';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

@Controller('tipos-aprendizaje')
export class TiposAprendizajeController {

  constructor(private readonly tiposAprendizajeService: TiposAprendizajeService) {}

  //Endpoint para la creacion de un nuevo tipo de aprendizaje
  @Post()
  @RequierePermisos(PERMISOS.SISTEMA_TOTAL, PERMISOS.USUARIOS_CREAR)
  async crear(@Body() body: CrearTiposAprendizajeDto) {
    return await this.tiposAprendizajeService.crear(body);
  }

  //Endpoint para listar todos los tipos de aprendizaje
  @Get()
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async listar() {
    return await this.tiposAprendizajeService.listar();
  }

  //Endpoint para listar todas los tipos de aprendizaje, incluyendo las inactivas
  @Get('todos')
  @RequierePermisos(PERMISOS.SISTEMA_TOTAL, PERMISOS.USUARIOS_VER)
  async listarTodos() {
    return await this.tiposAprendizajeService.listarTodos();
  }

  //Endpoint para obtener un tipo de aprendizaje por su id
  @Get(':id')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async obtenerPorId(@Param('id', ParseIntPipe) id: string) {
    return await this.tiposAprendizajeService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un tipo de aprendizaje por su id
  @Put(':id')
  @RequierePermisos(PERMISOS.SISTEMA_TOTAL, PERMISOS.USUARIOS_EDITAR)
  async actualizar(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: ActualizarTiposAprendizajeDto,
  ) {
    return await this.tiposAprendizajeService.actualizar(Number(id), body);
  }

  //Endpoint para inactivar un tipo de aprendizaje por su id
  @Patch(':id/inactivar')
  @RequierePermisos(PERMISOS.SISTEMA_TOTAL, PERMISOS.USUARIOS_CAMBIAR_ESTADO)
  async inactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.tiposAprendizajeService.inactivar(Number(id));
  }

  //Endpoint para reactivar un tipo de aprendizaje por su id
  @Patch(':id/reactivar')
  @RequierePermisos(PERMISOS.SISTEMA_TOTAL, PERMISOS.USUARIOS_CAMBIAR_ESTADO)
  async reactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.tiposAprendizajeService.reactivar(Number(id));
  }

}
