import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { TiposAprendizajeService } from '../servicios/tiposAprendizaje.service';
import { CrearTiposAprendizajeDto } from '../dto/crear-tiposAprendizaje';
import { ActualizarTiposAprendizajeDto } from '../dto/actualizar-tiposAprendizaje';

@Controller('tipos-aprendizaje')
export class TiposAprendizajeController {

  constructor(private readonly tiposAprendizajeService: TiposAprendizajeService) {}

  //Endpoint para la creacion de un nuevo tipo de aprendizaje
  @Post()
  async crear(@Body() body: CrearTiposAprendizajeDto) {
    return await this.tiposAprendizajeService.crear(body);
  }

  //Endpoint para listar todos los tipos de aprendizaje
  @Get()
  async listar() {
    return await this.tiposAprendizajeService.listar();
  }

  //Endpoint para listar todas los tipos de aprendizaje, incluyendo las inactivas
  @Get('todos')
  async listarTodos() {
    return await this.tiposAprendizajeService.listarTodos();
  }

  //Endpoint para obtener un tipo de aprendizaje por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: string) {
    return await this.tiposAprendizajeService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un tipo de aprendizaje por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: ActualizarTiposAprendizajeDto,
  ) {
    return await this.tiposAprendizajeService.actualizar(Number(id), body);
  }

  //Endpoint para inactivar un tipo de aprendizaje por su id
  @Patch(':id/inactivar')
  async inactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.tiposAprendizajeService.inactivar(Number(id));
  }

  //Endpoint para reactivar un tipo de aprendizaje por su id
  @Patch(':id/reactivar')
  async reactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.tiposAprendizajeService.reactivar(Number(id));
  }

}