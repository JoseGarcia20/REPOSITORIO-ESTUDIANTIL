import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { DetalleRutaAprendizajeService } from '../servicios/detalleRutaAprendizaje.service';
import { CrearDetalleRutaAprendizajeDto } from '../dto/crear-detalleRutaAprendizaje.dto';
import { ActualizarDetalleRutaAprendizajeDto } from '../dto/actualizar-detalleRutaAprendizaje.dto';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

@Controller('detalle-ruta-aprendizaje')
export class DetalleRutaAprendizajeController {

  constructor(private readonly detalleRutaAprendizajeService: DetalleRutaAprendizajeService) {}

  //Endpoint para la creacion de un nuevo DRA, con manejo de errores para campos únicos
  @Post()
  @RequierePermisos(PERMISOS.PREPARADOR_IA_USAR, PERMISOS.SISTEMA_TOTAL)
  async crear(@Body() body: CrearDetalleRutaAprendizajeDto) {
    return await this.detalleRutaAprendizajeService.crear(body);
  }

  //Endpoint para listar todos los DRA activos
  @Get()
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async listar() {
    return await this.detalleRutaAprendizajeService.listar();
  }

  //Endpoint para listar todos los DRA, incluyendo los inactivos
  @Get('todos')
  @RequierePermisos(PERMISOS.PREPARADOR_IA_USAR, PERMISOS.SISTEMA_TOTAL)
  async listarTodos() {
    return await this.detalleRutaAprendizajeService.listarTodos();
  }

  //Endpoint para obtener un DRA por su id
  @Get(':id')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return await this.detalleRutaAprendizajeService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un DRA por su id
  @Put(':id')
  @RequierePermisos(PERMISOS.PREPARADOR_IA_USAR, PERMISOS.SISTEMA_TOTAL)
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarDetalleRutaAprendizajeDto,
  ) {
    return await this.detalleRutaAprendizajeService.actualizar(id, body);
  }

}
