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
import { ForoService } from '../servicios/foro.service';
import { CrearForoDto } from '../dto/crear-foro.dto';
import { ActualizarForoDto } from '../dto/actualizar-foro.dto';
import { CrearComentarioForoDto } from '../dto/crear-comentario-foro.dto';
import { SubirRecursoForoDto } from '../dto/subir-recurso-foro.dto';
import { ComentarRecursoForoDto } from '../dto/comentar-recurso-foro.dto';
import { ComentarRecursoExistenteForoDto } from '../dto/comentar-recurso-existente-foro.dto';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

const opcionesArchivoRecursoForo = {
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
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/webp',
      'video/mp4',
      'video/webm',
    ];

    if (!permitidos.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Solo se permiten PDF, Word, Excel, PowerPoint, imágenes y videos',
        ),
        false,
      );
    }

    callback(null, true);
  },
};

@Controller('foros')
export class ForoController {
  constructor(private readonly foroService: ForoService) {}

  @Post()
  @RequierePermisos(PERMISOS.FOROS_CREAR)
  async crear(@Body() body: CrearForoDto, @Req() req: any) {
    return await this.foroService.crear(body, req.usuarioAuth);
  }

  @Get()
  @RequierePermisos(PERMISOS.FOROS_VER)
  async listar(@Req() req: any, @Query() query: any) {
    return await this.foroService.listar(req.usuarioAuth, query);
  }

  @Get('todos')
  @RequierePermisos(PERMISOS.FOROS_VER)
  async listarTodos(@Req() req: any, @Query() query: any) {
    return await this.foroService.listarTodos(req.usuarioAuth, query);
  }

  @Get('categorias')
  @RequierePermisos(PERMISOS.FOROS_CREAR)
  async listarCategoriasParaForo(@Req() req: any) {
    return await this.foroService.listarCategoriasParaForo(req.usuarioAuth);
  }

  @Post(':id/recursos')
  @RequierePermisos(PERMISOS.FOROS_SUBIR_RECURSO)
  @UseInterceptors(FileInterceptor('archivo', opcionesArchivoRecursoForo))
  async subirRecurso(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SubirRecursoForoDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return await this.foroService.subirRecursoDesdeForo(
      id,
      body,
      file,
      req.usuarioAuth,
    );
  }

  @Post(':id/comentarios/recurso')
  @RequierePermisos(PERMISOS.FOROS_COMENTAR, PERMISOS.FOROS_SUBIR_RECURSO)
  @UseInterceptors(FileInterceptor('archivo', opcionesArchivoRecursoForo))
  async comentarConRecurso(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ComentarRecursoForoDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return await this.foroService.comentarConRecurso(
      id,
      body,
      file,
      req.usuarioAuth,
    );
  }

  @Post(':id/comentarios/recurso-existente')
  @RequierePermisos(PERMISOS.FOROS_COMENTAR, PERMISOS.RECURSOS_VER)
  async comentarConRecursoExistente(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ComentarRecursoExistenteForoDto,
    @Req() req: any,
  ) {
    return await this.foroService.comentarConRecursoExistente(
      id,
      body,
      req.usuarioAuth,
    );
  }

  @Get(':id')
  @RequierePermisos(PERMISOS.FOROS_VER)
  async obtenerPorId(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.foroService.obtenerPorId(Number(id), req.usuarioAuth);
  }

  @Put(':id')
  @RequierePermisos(PERMISOS.FOROS_CREAR)
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarForoDto,
    @Req() req: any,
  ) {
    return await this.foroService.actualizar(id, body, req.usuarioAuth);
  }

  @Patch(':id/cerrar')
  @RequierePermisos(PERMISOS.FOROS_CERRAR)
  async cerrar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.foroService.cerrar(id, req.usuarioAuth);
  }

  @Patch(':id/inactivar')
  @RequierePermisos(PERMISOS.FOROS_CREAR)
  async inactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.foroService.inactivar(id, req.usuarioAuth);
  }

  @Patch(':id/reactivar')
  @RequierePermisos(PERMISOS.FOROS_CREAR)
  async reactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.foroService.reactivar(id, req.usuarioAuth);
  }

  @Post(':id/comentarios')
  @RequierePermisos(PERMISOS.FOROS_COMENTAR)
  async comentar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CrearComentarioForoDto,
    @Req() req: any,
  ) {
    return await this.foroService.comentar(id, body, req.usuarioAuth);
  }
}
