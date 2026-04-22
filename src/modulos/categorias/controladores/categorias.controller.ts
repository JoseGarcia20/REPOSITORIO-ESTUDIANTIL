import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { CategoriasService } from '../servicios/categorias.service';
import { CrearCategoriasDto } from '../dto/crear-categorias.dto';
import { ActualizarCategoriasDto } from '../dto/actualizar-categorias.dto';

@Controller('categorias')
export class CategoriasController {

  constructor(private readonly categoriasService: CategoriasService) {}

  //Endpoint para la creacion de un nueva categoria
  @Post()
  async crear(@Body() body: CrearCategoriasDto) {
    return await this.categoriasService.crear(body);
  }

  //Endpoint para listar todas las categorias
  @Get()
  async listar() {
    return await this.categoriasService.listar();
  }

  //Endpoint para listar todas las categorias, incluyendo las inactivas
  @Get('todas')
  async listarTodas() {
    return await this.categoriasService.listarTodas();
  }

  //Endpoint para obtener una categoria por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: string) {
    return await this.categoriasService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar una categoria por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: ActualizarCategoriasDto,
  ) {
    return await this.categoriasService.actualizar(Number(id), body);
  }

  //Endpoint para inactivar una categoria por su id
  @Patch(':id/inactivar')
  async inactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.categoriasService.inactivar(Number(id));
  }

  //Endpoint para reactivar una categoria por su id
  @Patch(':id/reactivar')
  async reactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.categoriasService.reactivar(Number(id));
  }

}