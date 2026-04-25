import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { CalificacionRecursoService } from '../servicios/calificacionRecurso.service';
import { CrearCalificacionRecursoDto } from '../dto/crear-calificacionRecurso.dto';
import { ActualizarCalificacionRecursoDto } from '../dto/actualizar-calificacionRecurso.dto';

@Controller('calificacion-recurso')
export class CalificacionRecursoController {

  constructor(private readonly calificacionRecursoService: CalificacionRecursoService) {}

  //Endpoint para la creacion de un nuevo CR
  @Post()
  async crear(@Body() body: CrearCalificacionRecursoDto) {
    return await this.calificacionRecursoService.crear(body);
  }

  //Endpoint para listar todos los CR activos
  @Get()
  async listar() {
    return await this.calificacionRecursoService.listar();
  }

  //Endpoint para listar todos los CR, incluyendo los inactivos
  @Get('todas')
  async listarTodas() {
    return await this.calificacionRecursoService.listarTodos();
  }

  //Endpoint para obtener un CR por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return await this.calificacionRecursoService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un CR por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarCalificacionRecursoDto,
  ) {
    return await this.calificacionRecursoService.actualizar(id, body);
  }

  //Endpoint para inactivar un CR por su id
  @Patch(':id/inactivar')
  async inactivar(@Param('id', ParseIntPipe) id: number) {
    return await this.calificacionRecursoService.inactivar(id);
  }

  //Endpoint para reactivar un CR por su id
  @Patch(':id/reactivar')
  async reactivar(@Param('id', ParseIntPipe) id: number) {
    return await this.calificacionRecursoService.reactivar(id);
  }

}