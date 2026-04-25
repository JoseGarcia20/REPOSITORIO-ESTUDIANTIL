import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { ForoService } from '../servicios/foro.service';
import { CrearForoDto } from '../dto/crear-foro.dto';
import { ActualizarForoDto } from '../dto/actualizar-foro.dto';

@Controller('foros')
export class ForoController {

  constructor(private readonly foroService: ForoService) {}

  //Endpoint para la creacion de un nuevo foro
  @Post()
  async crear(@Body() body: CrearForoDto) {
    return await this.foroService.crear(body);
  }

  //Endpoint para listar todos los foros activos
  @Get()
  async listar() {
    return await this.foroService.listar();
  }

  //Endpoint para listar todos los foros, incluyendo los inactivos
  @Get('todos')
  async listarTodos() {
    return await this.foroService.listarTodos();
  }

  //Endpoint para obtener un foro por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return await this.foroService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un foro por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarForoDto,
  ) {
    return await this.foroService.actualizar(id, body);
  }

  //Endpoint para inactivar un foro por su id
  @Patch(':id/inactivar')
  async inactivar(@Param('id', ParseIntPipe) id: number) {
    return await this.foroService.inactivar(id);
  }

  //Endpoint para reactivar un foro por su id
  @Patch(':id/reactivar')
  async reactivar(@Param('id', ParseIntPipe) id: number) {
    return await this.foroService.reactivar(id);
  }

}