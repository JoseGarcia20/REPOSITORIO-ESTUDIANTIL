import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { RutaAprendizajeService } from '../servicios/rutaAprendizaje.service';
import { CrearRutaAprendizajeDto } from '../dto/crear-rutaAprendizaje.dto';
import { ActualizarRutaAprendizajeDto } from '../dto/actualizar-rutaAprendizaje.dto';

@Controller('ruta-aprendizaje')
export class RutaAprendizajeController {

  constructor(private readonly rutaAprendizajeService: RutaAprendizajeService) {}

  //Endpoint para la creacion de un nuevo RA
  @Post()
  async crear(@Body() body: CrearRutaAprendizajeDto) {
    return await this.rutaAprendizajeService.crear(body);
  }

  //Endpoint para listar todos los RA activos
  @Get()
  async listar() {
    return await this.rutaAprendizajeService.listar();
  }

  //Endpoint para listar todos los RA, incluyendo los inactivos
  @Get('todas')
  async listarTodas() {
    return await this.rutaAprendizajeService.listarTodos();
  }

  //Endpoint para obtener un RA por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return await this.rutaAprendizajeService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un RA por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarRutaAprendizajeDto,
  ) {
    return await this.rutaAprendizajeService.actualizar(id, body);
  }

  //Endpoint para inactivar un RA por su id
  @Patch(':id/inactivar')
  async inactivar(@Param('id', ParseIntPipe) id: number) {
    return await this.rutaAprendizajeService.inactivar(id);
  }

  //Endpoint para reactivar un usuario por su id
  @Patch(':id/reactivar')
  async reactivar(@Param('id', ParseIntPipe) id: number) {
    return await this.rutaAprendizajeService.reactivar(id);
  }

}