import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { InstitucionesService } from '../servicios/instituciones.service';
import { CrearInstitucionDto } from '../dto/crear-institucion.dto';
import { ActualizarInstitucionDto } from '../dto/actualizar-institucion.dto';
import { UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('instituciones')
export class InstitucionesController {

  constructor(private readonly institucionesService: InstitucionesService) {}

  //Endpoint para la creacion de una nueva institucion (solo superadministrador)
  @UseGuards(JwtAuthGuard)
  @Post()
  async crear(@Body() body: CrearInstitucionDto, @Req() req: any) {
    return await this.institucionesService.crear(body, req.usuarioAuth);
  }

  //Endpoint para listar todas las instituciones activas (público para login)
  @Get()
  async listar() {
    return await this.institucionesService.listar();
  }

  //Endpoint para listar instituciones según rol autenticado
  @UseGuards(JwtAuthGuard)
  @Get('todas')
  async listarTodas(@Req() req: any) {
    return await this.institucionesService.listarTodas(req.usuarioAuth);
  }

  //Endpoint para obtener una institucion por su id
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.institucionesService.obtenerPorId(Number(id), req.usuarioAuth);
  }

  //Endpoint para actualizar una institucion por su id
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: ActualizarInstitucionDto,
    @Req() req: any,
  ) {
    return await this.institucionesService.actualizar(Number(id), body, req.usuarioAuth);
  }

  //Endpoint para inactivar una institucion por su id
  @UseGuards(JwtAuthGuard)
  @Patch(':id/inactivar')
  async inactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.institucionesService.inactivar(Number(id), req.usuarioAuth);
  }

  //Endpoint para reactivar una institucion por su id
  @UseGuards(JwtAuthGuard)
  @Patch(':id/reactivar')
  async reactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.institucionesService.reactivar(Number(id), req.usuarioAuth);
  }

  //Endpoint para subir logo de institución (solo superadministrador)
  @UseGuards(JwtAuthGuard)
  @Post('subir-logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads/instituciones',
        filename: (_req, file, callback) => {
          const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `${nombre}${extname(file.originalname)}`);
        },
      }),

      fileFilter: (_req, file, callback) => {
        const permitidos = [
          'image/png',
          'image/jpeg',
          'image/webp',
        ];

        if (!permitidos.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Solo se permiten imágenes PNG, JPG, JPEG o WEBP',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  subirLogo(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    return this.institucionesService.validarSubidaLogo(req.usuarioAuth, file);
  }

}
