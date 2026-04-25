import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { DiagnosticoAprendizajeService } from '../servicios/diagnosticoAprendizaje.service';
import { CrearDiagnosticoAprendizajeDto } from '../dto/crear-diagnosticoAprendizaje.dto';
import { ActualizarDiagnosticoAprendizajeDto } from '../dto/actualizar-diagnosticoAprendizaje.dto';

@Controller('diagnostico-aprendizaje')
export class DiagnosticoAprendizajeController {

  constructor(private readonly diagnosticoAprendizajeService: DiagnosticoAprendizajeService) {}

  //Endpoint para la creacion de un nuevo DA
  @Post()
  async crear(@Body() body: CrearDiagnosticoAprendizajeDto) {
    return await this.diagnosticoAprendizajeService.crear(body);
  }

  //Endpoint para listar todos los DA activos
  @Get()
  async listar() {
    return await this.diagnosticoAprendizajeService.listar();
  }

  //Endpoint para listar todos los DA, incluyendo los inactivos
  @Get('todos')
  async listarTodos() {
    return await this.diagnosticoAprendizajeService.listarTodos();
  }

  //Endpoint para obtener un DA por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return await this.diagnosticoAprendizajeService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un DA por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarDiagnosticoAprendizajeDto,
  ) {
    return await this.diagnosticoAprendizajeService.actualizar(id, body);
  }

}