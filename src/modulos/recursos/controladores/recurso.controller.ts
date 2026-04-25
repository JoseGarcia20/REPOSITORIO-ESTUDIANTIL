import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { RecursoService } from '../servicios/recurso.service';
import { CrearRecursoDto } from '../dto/crear-recurso.dto';
import { ActualizarRecursoDto } from '../dto/actualizar-recurso.dto';

@Controller('recursos')
export class RecursoController {

  constructor(private readonly recursoService: RecursoService) {}

  //Endpoint para la creacion de un nuevo recurso
  @Post()
  async crear(@Body() body: CrearRecursoDto) {
    return await this.recursoService.crear(body);
  }

  //Endpoint para listar todos los recurso activos
  @Get()
  async listar() {
    return await this.recursoService.listar();
  }

  //Endpoint para listar todos los recursos, incluyendo los inactivos
  @Get('todos')
  async listarTodos() {
    return await this.recursoService.listarTodos();
  }

  //Endpoint para obtener un recursos por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return await this.recursoService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un recurso por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarRecursoDto,
  ) {
    return await this.recursoService.actualizar(id, body);
  }

  //Endpoint para inactivar un recurso por su id
  @Patch(':id/inactivar')
  async inactivar(@Param('id', ParseIntPipe) id: number) {
    return await this.recursoService.inactivar(id);
  }

  //Endpoint para reactivar un recurso por su id
  @Patch(':id/reactivar')
  async reactivar(@Param('id', ParseIntPipe) id: number) {
    return await this.recursoService.reactivar(id);
  }

}