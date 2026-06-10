import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { RutaAprendizajeService } from '../servicios/rutaAprendizaje.service';
import { CrearRutaAprendizajeDto } from '../dto/crear-rutaAprendizaje.dto';
import { ActualizarRutaAprendizajeDto } from '../dto/actualizar-rutaAprendizaje.dto';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

@Controller('ruta-aprendizaje')
export class RutaAprendizajeController {

  constructor(private readonly rutaAprendizajeService: RutaAprendizajeService) {}

  //Endpoint para la creacion de un nuevo RA
  @Post()
  @RequierePermisos(PERMISOS.PREPARADOR_IA_USAR, PERMISOS.SISTEMA_TOTAL)
  async crear(@Body() body: CrearRutaAprendizajeDto) {
    return await this.rutaAprendizajeService.crear(body);
  }

  //Endpoint para listar todos los RA activos
  @Get()
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async listar() {
    return await this.rutaAprendizajeService.listar();
  }

  //Endpoint para listar todos los RA, incluyendo los inactivos
  @Get('todas')
  @RequierePermisos(PERMISOS.PREPARADOR_IA_USAR, PERMISOS.SISTEMA_TOTAL)
  async listarTodas() {
    return await this.rutaAprendizajeService.listarTodos();
  }

  //Endpoint para obtener un RA por su id
  @Get(':id')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return await this.rutaAprendizajeService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un RA por su id
  @Put(':id')
  @RequierePermisos(PERMISOS.PREPARADOR_IA_USAR, PERMISOS.SISTEMA_TOTAL)
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarRutaAprendizajeDto,
  ) {
    return await this.rutaAprendizajeService.actualizar(id, body);
  }

  //Endpoint para inactivar un RA por su id
  @Patch(':id/inactivar')
  @RequierePermisos(PERMISOS.PREPARADOR_IA_USAR, PERMISOS.SISTEMA_TOTAL)
  async inactivar(@Param('id', ParseIntPipe) id: number) {
    return await this.rutaAprendizajeService.inactivar(id);
  }

  //Endpoint para reactivar un usuario por su id
  @Patch(':id/reactivar')
  @RequierePermisos(PERMISOS.PREPARADOR_IA_USAR, PERMISOS.SISTEMA_TOTAL)
  async reactivar(@Param('id', ParseIntPipe) id: number) {
    return await this.rutaAprendizajeService.reactivar(id);
  }

}
