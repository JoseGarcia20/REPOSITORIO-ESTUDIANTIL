import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { DetalleRutaAprendizajeService } from '../servicios/detalleRutaAprendizaje.service';
import { CrearDetalleRutaAprendizajeDto } from '../dto/crear-detalleRutaAprendizaje.dto';
import { ActualizarDetalleRutaAprendizajeDto } from '../dto/actualizar-detalleRutaAprendizaje.dto';

@Controller('detalle-ruta-aprendizaje')
export class DetalleRutaAprendizajeController {

  constructor(private readonly detalleRutaAprendizajeService: DetalleRutaAprendizajeService) {}

  //Endpoint para la creacion de un nuevo DRA, con manejo de errores para campos únicos
  @Post()
  async crear(@Body() body: CrearDetalleRutaAprendizajeDto) {
    return await this.detalleRutaAprendizajeService.crear(body);
  }

  //Endpoint para listar todos los DRA activos
  @Get()
  async listar() {
    return await this.detalleRutaAprendizajeService.listar();
  }

  //Endpoint para listar todos los DRA, incluyendo los inactivos
  @Get('todos')
  async listarTodos() {
    return await this.detalleRutaAprendizajeService.listarTodos();
  }

  //Endpoint para obtener un DRA por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return await this.detalleRutaAprendizajeService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un DRA por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarDetalleRutaAprendizajeDto,
  ) {
    return await this.detalleRutaAprendizajeService.actualizar(id, body);
  }

}