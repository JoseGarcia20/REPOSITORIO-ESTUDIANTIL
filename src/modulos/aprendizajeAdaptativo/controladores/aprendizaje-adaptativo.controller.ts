import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';
import { ActualizarPasoAdaptativoDto } from '../dto/actualizar-paso-adaptativo.dto';
import { CrearAsignacionAdaptativaDto } from '../dto/crear-asignacion-adaptativa.dto';
import { CrearTipoAprendizajeAdaptativoDto } from '../dto/crear-tipo-aprendizaje-adaptativo.dto';
import { EnviarEvaluacionAdaptativaDto } from '../dto/enviar-evaluacion-adaptativa.dto';
import { GuardarEvaluacionAdaptativaDto } from '../dto/guardar-evaluacion-adaptativa.dto';
import { ResponderEntrevistaAdaptativaDto } from '../dto/responder-entrevista-adaptativa.dto';
import { RevisarAsignacionAdaptativaDto } from '../dto/revisar-asignacion-adaptativa.dto';
import { AprendizajeAdaptativoService } from '../servicios/aprendizaje-adaptativo.service';

const PERMISOS_USO_APRENDIZAJE = [
  PERMISOS.FOROS_VER,
  PERMISOS.RECURSOS_VER,
  PERMISOS.PREPARADOR_IA_USAR,
];

@Controller('aprendizaje-adaptativo')
export class AprendizajeAdaptativoController {
  constructor(
    private readonly aprendizajeAdaptativoService: AprendizajeAdaptativoService,
  ) {}

  @Get('catalogos')
  @RequierePermisos(...PERMISOS_USO_APRENDIZAJE)
  async catalogos(@Req() req: any) {
    return await this.aprendizajeAdaptativoService.catalogos(req.usuarioAuth);
  }

  @Get('asignaciones')
  @RequierePermisos(...PERMISOS_USO_APRENDIZAJE)
  async listar(@Req() req: any) {
    return await this.aprendizajeAdaptativoService.listar(req.usuarioAuth);
  }

  @Post('asignaciones')
  @RequierePermisos(...PERMISOS_USO_APRENDIZAJE)
  async crear(@Body() body: CrearAsignacionAdaptativaDto, @Req() req: any) {
    return await this.aprendizajeAdaptativoService.crear(body, req.usuarioAuth);
  }

  @Post('tipos')
  @RequierePermisos(PERMISOS.SISTEMA_TOTAL, PERMISOS.TIPOS_RECURSOS_VER)
  async crearTipo(
    @Body() body: CrearTipoAprendizajeAdaptativoDto,
    @Req() req: any,
  ) {
    return await this.aprendizajeAdaptativoService.crearTipoAprendizaje(
      body,
      req.usuarioAuth,
    );
  }

  @Patch('tipos/:id/inactivar')
  @RequierePermisos(PERMISOS.SISTEMA_TOTAL, PERMISOS.TIPOS_RECURSOS_VER)
  async inactivarTipo(@Param('id') id: string, @Req() req: any) {
    return await this.aprendizajeAdaptativoService.inactivarTipoAprendizaje(
      Number(id),
      req.usuarioAuth,
    );
  }

  @Post(':id/aprobar')
  @RequierePermisos(...PERMISOS_USO_APRENDIZAJE)
  async aprobar(@Param('id') id: string, @Req() req: any) {
    return await this.aprendizajeAdaptativoService.aprobar(
      Number(id),
      req.usuarioAuth,
    );
  }

  @Post(':id/entrevista')
  @RequierePermisos(...PERMISOS_USO_APRENDIZAJE)
  async entrevista(
    @Param('id') id: string,
    @Body() body: ResponderEntrevistaAdaptativaDto,
    @Req() req: any,
  ) {
    return await this.aprendizajeAdaptativoService.responderEntrevista(
      Number(id),
      body,
      req.usuarioAuth,
    );
  }

  @Post(':id/iniciar')
  @RequierePermisos(...PERMISOS_USO_APRENDIZAJE)
  async iniciar(@Param('id') id: string, @Req() req: any) {
    return await this.aprendizajeAdaptativoService.iniciarRuta(
      Number(id),
      req.usuarioAuth,
    );
  }

  @Post(':id/regenerar-ruta')
  @RequierePermisos(...PERMISOS_USO_APRENDIZAJE)
  async regenerarRuta(@Param('id') id: string, @Req() req: any) {
    return await this.aprendizajeAdaptativoService.regenerarRuta(
      Number(id),
      req.usuarioAuth,
    );
  }

  @Patch(':id/pasos/:indice')
  @RequierePermisos(...PERMISOS_USO_APRENDIZAJE)
  async actualizarPaso(
    @Param('id') id: string,
    @Param('indice') indice: string,
    @Body() body: ActualizarPasoAdaptativoDto,
    @Req() req: any,
  ) {
    return await this.aprendizajeAdaptativoService.actualizarPaso(
      Number(id),
      Number(indice),
      body,
      req.usuarioAuth,
    );
  }

  @Post(':id/evaluacion')
  @RequierePermisos(...PERMISOS_USO_APRENDIZAJE)
  async evaluacion(
    @Param('id') id: string,
    @Body() body: EnviarEvaluacionAdaptativaDto,
    @Req() req: any,
  ) {
    return await this.aprendizajeAdaptativoService.enviarEvaluacion(
      Number(id),
      body,
      req.usuarioAuth,
    );
  }

  @Post(':id/evaluacion/iniciar')
  @RequierePermisos(...PERMISOS_USO_APRENDIZAJE)
  async iniciarEvaluacion(@Param('id') id: string, @Req() req: any) {
    return await this.aprendizajeAdaptativoService.iniciarEvaluacion(
      Number(id),
      req.usuarioAuth,
    );
  }

  @Post(':id/evaluacion/parcial')
  @RequierePermisos(...PERMISOS_USO_APRENDIZAJE)
  async guardarParcialEvaluacion(
    @Param('id') id: string,
    @Body() body: GuardarEvaluacionAdaptativaDto,
    @Req() req: any,
  ) {
    return await this.aprendizajeAdaptativoService.guardarParcialEvaluacion(
      Number(id),
      body,
      req.usuarioAuth,
    );
  }

  @Post(':id/evaluacion/cerrar')
  @RequierePermisos(...PERMISOS_USO_APRENDIZAJE)
  async cerrarEvaluacion(
    @Param('id') id: string,
    @Body() body: GuardarEvaluacionAdaptativaDto,
    @Req() req: any,
  ) {
    return await this.aprendizajeAdaptativoService.cerrarEvaluacion(
      Number(id),
      body,
      req.usuarioAuth,
    );
  }

  @Post(':id/revisar')
  @RequierePermisos(...PERMISOS_USO_APRENDIZAJE)
  async revisar(
    @Param('id') id: string,
    @Body() body: RevisarAsignacionAdaptativaDto,
    @Req() req: any,
  ) {
    return await this.aprendizajeAdaptativoService.revisar(
      Number(id),
      body,
      req.usuarioAuth,
    );
  }
}
