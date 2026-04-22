import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { InstitucionesService } from '../servicios/instituciones.service';
import { CrearInstitucionDto } from '../dto/crear-institucion.dto';
import { ActualizarInstitucionDto } from '../dto/actualizar-institucion.dto';

@Controller('instituciones')
export class InstitucionesController {

  constructor(private readonly institucionesService: InstitucionesService) {}

  //Endpoint para la creacion de una nueva institucion
  @Post()
  async crear(@Body() body: CrearInstitucionDto) {
    return await this.institucionesService.crear(body);
  }

  //Endpoint para listar todas las instituciones
  @Get()
  async listar() {
    return await this.institucionesService.listar();
  }

  //Endpoint para listar todas las instituciones, incluyendo las inactivas
  @Get('todas')
  async listarTodas() {
    return await this.institucionesService.listarTodas();
  }

  //Endpoint para obtener una institucion por su id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: string) {
    return await this.institucionesService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar una institucion por su id
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: ActualizarInstitucionDto,
  ) {
    return await this.institucionesService.actualizar(Number(id), body);
  }

  //Endpoint para inactivar una institucion por su id
  @Patch(':id/inactivar')
  async inactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.institucionesService.inactivar(Number(id));
  }

  //Endpoint para reactivar una institucion por su id
  @Patch(':id/reactivar')
  async reactivar(@Param('id', ParseIntPipe) id: string) {
    return await this.institucionesService.reactivar(Number(id));
  }

}