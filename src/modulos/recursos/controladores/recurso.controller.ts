import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RecursoService } from '../servicios/recurso.service';
import { CrearRecursoDto } from '../dto/crear-recurso.dto';
import { ActualizarRecursoDto } from '../dto/actualizar-recurso.dto';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

@Controller('recursos')
export class RecursoController {
  constructor(private readonly recursoService: RecursoService) {}
  @Post()
  @RequierePermisos(PERMISOS.RECURSOS_CREAR)
  async crear(@Body() body: CrearRecursoDto, @Req() req: any) { return await this.recursoService.crear(body, req.usuarioAuth); }

  @Get()
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async listar(@Req() req: any, @Query() query: any) { return await this.recursoService.listar(req.usuarioAuth, query); }

  @Get('todos')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async listarTodos(@Req() req: any, @Query() query: any) { return await this.recursoService.listarTodos(req.usuarioAuth, query); }

  @Post('subir-archivo')
  @RequierePermisos(PERMISOS.RECURSOS_SUBIR_ARCHIVO)
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: './uploads/recursos',
        filename: (_req, file, callback) => {
          const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `${nombre}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024,
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
    }),
  )
  subirArchivo(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    return this.recursoService.validarSubidaArchivo(req.usuarioAuth, file);
  }

  @Get(':id')
  @RequierePermisos(PERMISOS.RECURSOS_VER)
  async obtenerPorId(@Param('id', ParseIntPipe) id: number, @Req() req: any) { return await this.recursoService.obtenerPorId(Number(id), req.usuarioAuth); }

  @Put(':id')
  @RequierePermisos(PERMISOS.RECURSOS_EDITAR)
  async actualizar(@Param('id', ParseIntPipe) id: number, @Body() body: ActualizarRecursoDto, @Req() req: any) { return await this.recursoService.actualizar(id, body, req.usuarioAuth); }

  @Patch(':id/inactivar')
  @RequierePermisos(PERMISOS.RECURSOS_CAMBIAR_ESTADO)
  async inactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) { return await this.recursoService.inactivar(id, req.usuarioAuth); }

  @Patch(':id/reactivar')
  @RequierePermisos(PERMISOS.RECURSOS_CAMBIAR_ESTADO)
  async reactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) { return await this.recursoService.reactivar(id, req.usuarioAuth); }
}
