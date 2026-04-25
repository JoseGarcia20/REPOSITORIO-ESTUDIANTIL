import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { TiposRecursosService } from '../servicios/tiposRecursos.service';
import { CrearTiposRecursosDto } from '../dto/crear-tiposRecursos';
import { ActualizarTiposRecursosDto } from '../dto/actualizar-tiposRecursos';

@Controller('tipos-recursos')
export class TiposRecursosController {

  constructor(private readonly tiposRecursosService: TiposRecursosService) {}

  //Endpoint para la creacion de un nuevo tipo de recurso
  @Post()
  async crear(@Body() body: CrearTiposRecursosDto) {
    return await this.tiposRecursosService.crear(body);
  }

  //Endpoint para listar todos los tipos de recursos activos
  @Get()
  async listar() {
    return await this.tiposRecursosService.listar();
  }

  //Endpoint para listar todas los tipos de recursos, incluyendo las inactivas
  @Get('todos')
  async listarTodos() {
    return await this.tiposRecursosService.listarTodos();
  }

  //Endpoint para obtener un tipo de recurso por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: string) {
    return await this.tiposRecursosService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un tipo de recurso por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: ActualizarTiposRecursosDto,
  ) {
    return await this.tiposRecursosService.actualizar(Number(id), body);
  }

  //Endpoint para inactivar un tipo de recursos por su id
  @Patch(':id/inactivar')
  async inactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.tiposRecursosService.inactivar(Number(id));
  }

  //Endpoint para reactivar un tipo de recursos por su id
  @Patch(':id/reactivar')
  async reactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.tiposRecursosService.reactivar(Number(id));
  }

}