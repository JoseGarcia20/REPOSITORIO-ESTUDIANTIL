import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { RespuestaForoService } from '../servicios/respuestaForo.service';
import { CrearRespuestaForoDto } from '../dto/crear-respuestaForo.dto';
import { ActualizarRespuestaForoDto } from '../dto/actualizar-respuestaForo.dto';

@Controller('respuesta-foro')
export class RespuestaForoController {

  constructor(private readonly respuestaForo: RespuestaForoService) {}

  //Endpoint para la creacion de un nuevo RF
  @Post()
  async crear(@Body() body: CrearRespuestaForoDto) {
    return await this.respuestaForo.crear(body);
  }

  //Endpoint para listar todas los RF
  @Get()
  async listar() {
    return await this.respuestaForo.listar();
  }

  //Endpoint para listar todas los RF, incluyendo las inactivas
  @Get('todas')
  async listarTodas() {
    return await this.respuestaForo.listarTodos();
  }

  //Endpoint para obtener un rol por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: string) {
    return await this.respuestaForo.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un RF por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: ActualizarRespuestaForoDto,
  ) {
    return await this.respuestaForo.actualizar(Number(id), body);
  }

  //Endpoint para inactivar un RF por su id
  @Patch(':id/inactivar')
  async inactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.respuestaForo.inactivar(Number(id));
  }

  //Endpoint para reactivar un RF por su id
  @Patch(':id/reactivar')
  async reactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.respuestaForo.reactivar(Number(id));
  }

}