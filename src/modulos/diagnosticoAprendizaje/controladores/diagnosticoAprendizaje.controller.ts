import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { DiagnosticoAprendizajeService } from '../servicios/diagnosticoAprendizaje.service';
import { CrearDiagnosticoAprendizajeDto } from '../dto/crear-diagnosticoAprendizaje.dto';
import { ActualizarDiagnosticoAprendizajeDto } from '../dto/actualizar-diagnosticoAprendizaje.dto';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

@Controller('diagnostico-aprendizaje')
export class DiagnosticoAprendizajeController {

  constructor(private readonly diagnosticoAprendizajeService: DiagnosticoAprendizajeService) {}

  //Endpoint para la creacion de un nuevo DA
  @Post()
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async crear(@Body() body: CrearDiagnosticoAprendizajeDto) {
    return await this.diagnosticoAprendizajeService.crear(body);
  }

  //Endpoint para listar todos los DA activos
  @Get()
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async listar() {
    return await this.diagnosticoAprendizajeService.listar();
  }

  //Endpoint para listar todos los DA, incluyendo los inactivos
  @Get('todos')
  @RequierePermisos(PERMISOS.PREPARADOR_IA_USAR, PERMISOS.SISTEMA_TOTAL)
  async listarTodos() {
    return await this.diagnosticoAprendizajeService.listarTodos();
  }

  //Endpoint para obtener un DA por su id
  @Get(':id')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return await this.diagnosticoAprendizajeService.obtenerPorId(Number(id));
  }

  //Endpoint para actualizar un DA por su id
  @Put(':id')
  @RequierePermisos(PERMISOS.PREPARADOR_IA_USAR, PERMISOS.SISTEMA_TOTAL)
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarDiagnosticoAprendizajeDto,
  ) {
    return await this.diagnosticoAprendizajeService.actualizar(id, body);
  }

}
