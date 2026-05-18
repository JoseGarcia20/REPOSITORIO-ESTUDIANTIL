import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AulaColaborativaService } from '../servicios/aulaColaborativa.service';
import { CrearProyectoColaborativoDto } from '../dto/crear-proyecto-colaborativo.dto';
import { CrearActividadColaborativaDto } from '../dto/crear-actividad-colaborativa.dto';
import { ActualizarEstadoActividadDto } from '../dto/actualizar-estado-actividad.dto';
import { SubirEvidenciaDto } from '../dto/subir-evidencia.dto';
import { CrearEntregaColaborativaDto } from '../dto/crear-entrega-colaborativa.dto';
import { RevisarEntregaColaborativaDto } from '../dto/revisar-entrega-colaborativa.dto';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

const carpetaAulaColaborativa = './uploads/aula-colaborativa';

const opcionesArchivoAulaColaborativa = {
  storage: diskStorage({
    destination: (_req, _file, callback) => {
      if (!existsSync(carpetaAulaColaborativa)) {
        mkdirSync(carpetaAulaColaborativa, { recursive: true });
      }

      callback(null, carpetaAulaColaborativa);
    },
    filename: (_req, file, callback) => {
      const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `${nombre}${extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const permitidos = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png',
      'image/jpeg',
      'image/webp',
      'video/mp4',
      'video/webm',
    ];

    if (!permitidos.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Solo se permiten PDF, Word, PowerPoint, imágenes y videos',
        ),
        false,
      );
    }

    callback(null, true);
  },
};

@Controller('aula-colaborativa')
export class AulaColaborativaController {
  constructor(
    private readonly aulaColaborativaService: AulaColaborativaService,
  ) {}

  @Get('catalogos')
  @RequierePermisos(PERMISOS.AULA_COLABORATIVA_VER)
  async catalogos(@Req() req: any, @Query() query: any) {
    return await this.aulaColaborativaService.catalogos(req.usuarioAuth, query);
  }

  @Get()
  @RequierePermisos(PERMISOS.AULA_COLABORATIVA_VER)
  async listar(@Req() req: any, @Query() query: any) {
    return await this.aulaColaborativaService.listar(req.usuarioAuth, query);
  }

  @Post()
  @RequierePermisos(PERMISOS.AULA_COLABORATIVA_CREAR)
  async crear(@Body() body: CrearProyectoColaborativoDto, @Req() req: any) {
    return await this.aulaColaborativaService.crear(body, req.usuarioAuth);
  }

  @Get(':id')
  @RequierePermisos(PERMISOS.AULA_COLABORATIVA_VER)
  async obtenerPorId(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.aulaColaborativaService.obtenerPorId(id, req.usuarioAuth);
  }

  @Post(':id/actividades')
  @RequierePermisos(
    PERMISOS.AULA_COLABORATIVA_GESTIONAR,
    PERMISOS.AULA_COLABORATIVA_PARTICIPAR,
  )
  async crearActividad(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CrearActividadColaborativaDto,
    @Req() req: any,
  ) {
    return await this.aulaColaborativaService.crearActividad(
      id,
      body,
      req.usuarioAuth,
    );
  }

  @Patch(':id/actividades/:actividadId/estado')
  @RequierePermisos(PERMISOS.AULA_COLABORATIVA_PARTICIPAR)
  async actualizarEstadoActividad(
    @Param('id', ParseIntPipe) id: number,
    @Param('actividadId', ParseIntPipe) actividadId: number,
    @Body() body: ActualizarEstadoActividadDto,
    @Req() req: any,
  ) {
    return await this.aulaColaborativaService.actualizarEstadoActividad(
      id,
      actividadId,
      body,
      req.usuarioAuth,
    );
  }

  @Post(':id/actividades/:actividadId/evidencias')
  @RequierePermisos(PERMISOS.AULA_COLABORATIVA_PARTICIPAR)
  @UseInterceptors(FileInterceptor('archivo', opcionesArchivoAulaColaborativa))
  async subirEvidencia(
    @Param('id', ParseIntPipe) id: number,
    @Param('actividadId', ParseIntPipe) actividadId: number,
    @Body() body: SubirEvidenciaDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return await this.aulaColaborativaService.subirEvidencia(
      id,
      actividadId,
      body,
      file,
      req.usuarioAuth,
    );
  }

  @Post(':id/entregas')
  @RequierePermisos(PERMISOS.AULA_COLABORATIVA_PARTICIPAR)
  @UseInterceptors(FileInterceptor('archivo', opcionesArchivoAulaColaborativa))
  async crearEntrega(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CrearEntregaColaborativaDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return await this.aulaColaborativaService.crearEntrega(
      id,
      body,
      file,
      req.usuarioAuth,
    );
  }

  @Patch(':id/entregas/:entregaId/revisar')
  @RequierePermisos(PERMISOS.AULA_COLABORATIVA_REVISAR)
  async revisarEntrega(
    @Param('id', ParseIntPipe) id: number,
    @Param('entregaId', ParseIntPipe) entregaId: number,
    @Body() body: RevisarEntregaColaborativaDto,
    @Req() req: any,
  ) {
    return await this.aulaColaborativaService.revisarEntrega(
      id,
      entregaId,
      body,
      req.usuarioAuth,
    );
  }
}
