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
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RecursoService } from '../servicios/recurso.service';
import { CrearRecursoDto } from '../dto/crear-recurso.dto';
import { ActualizarRecursoDto } from '../dto/actualizar-recurso.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('recursos')
export class RecursoController {
  constructor(private readonly recursoService: RecursoService) {}
  @Post() async crear(@Body() body: CrearRecursoDto, @Req() req: any) { return await this.recursoService.crear(body, req.usuarioAuth); }
  @Get() async listar(@Req() req: any) { return await this.recursoService.listar(req.usuarioAuth); }
  @Get('todos') async listarTodos(@Req() req: any) { return await this.recursoService.listarTodos(req.usuarioAuth); }
  @Post('subir-archivo')
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
        ];

        if (!permitidos.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Solo se permiten PDF, Word, PowerPoint e imágenes',
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
  @Get(':id') async obtenerPorId(@Param('id', ParseIntPipe) id: number, @Req() req: any) { return await this.recursoService.obtenerPorId(Number(id), req.usuarioAuth); }
  @Put(':id') async actualizar(@Param('id', ParseIntPipe) id: number, @Body() body: ActualizarRecursoDto, @Req() req: any) { return await this.recursoService.actualizar(id, body, req.usuarioAuth); }
  @Patch(':id/inactivar') async inactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) { return await this.recursoService.inactivar(id, req.usuarioAuth); }
  @Patch(':id/reactivar') async reactivar(@Param('id', ParseIntPipe) id: number, @Req() req: any) { return await this.recursoService.reactivar(id, req.usuarioAuth); }
}
