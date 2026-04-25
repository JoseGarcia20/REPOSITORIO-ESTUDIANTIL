import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { DetalleDiagnosticoAprendizajeService } from '../servicios/detalleDiagnosticoAprendizaje.service';
import { CrearDetalleDiagnosticoAprendizajeDto } from '../dto/crear-detalleDiagnosticoAprendizaje.dto.';
import { ActualizarDetalleDiagnosticoAprendizajeDto } from '../dto/actualizar-detalleDiagnosticoAprendizaje.dto';

@Controller('detalle-diagnostico-aprendizaje')
export class DetalleDiagnosticoAprendizajeController {

  constructor(private readonly detalleDiagnosticoAprendizaje: DetalleDiagnosticoAprendizajeService) {}

  //Endpoint para la creacion de un nuevo DRA, con manejo de errores para campos únicos
  @Post()
  async crear(@Body() body: CrearDetalleDiagnosticoAprendizajeDto) {
    return await this.detalleDiagnosticoAprendizaje.crear(body);
  }

  //Endpoint para listar todos los DRA activos
  @Get()
  async listar() {
    return await this.detalleDiagnosticoAprendizaje.listar();
  }

  //Endpoint para listar todos los DRA, incluyendo los inactivos
  @Get('todos')
  async listarTodos() {
    return await this.detalleDiagnosticoAprendizaje.listarTodos();
  }

  //Endpoint para obtener un DRA por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return await this.detalleDiagnosticoAprendizaje.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un DRA por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarDetalleDiagnosticoAprendizajeDto,
  ) {
    return await this.detalleDiagnosticoAprendizaje.actualizar(id, body);
  }

}