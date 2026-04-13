import { Body, Controller, Post, Get, Param, Put, Patch } from '@nestjs/common';
import { InstitucionesService } from '../servicios/instituciones.service';

@Controller('instituciones')
export class InstitucionesController {

  constructor(private readonly institucionesService: InstitucionesService) {}

  //Endpoint para la creacion de una nueva institucion
  @Post()
  async crear(@Body() body: any) {
    return await this.institucionesService.crear(body);
  }

  //Endpoint para listar todas las instituciones
  @Get()
  async listar() {
    return await this.institucionesService.listar();
  }

  //Endpoint para obtener una institucion por su id
  @Get(':id')
  async obtenerPorId(@Param('id') id: string) {
    return await this.institucionesService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar una institucion por su id
  @Put(':id')
  async actualizar(@Param('id') id: string, @Body() body: any) {
    return await this.institucionesService.actualizar(Number(id), body);
}

  //Endpoint para inactivar una institucion por su id
  @Patch(':id/inactivar')
  async inactivar(@Param('id') id: string) {
    return await this.institucionesService.inactivar(Number(id));
  }

}