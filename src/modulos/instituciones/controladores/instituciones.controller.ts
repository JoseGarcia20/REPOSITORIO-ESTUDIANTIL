import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Req } from '@nestjs/common';
import { InstitucionesService } from '../servicios/instituciones.service';
import { CrearInstitucionDto } from '../dto/crear-institucion.dto';
import { ActualizarInstitucionDto } from '../dto/actualizar-institucion.dto';
import { UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';

@Controller('instituciones')
export class InstitucionesController {

  constructor(private readonly institucionesService: InstitucionesService) {}

  //Endpoint para la creacion de una nueva institucion (solo superadministrador)
  @Post()
  @RequierePermisos(PERMISOS.INSTITUCIONES_CREAR)
  async crear(@Body() body: CrearInstitucionDto, @Req() req: any) {
    return await this.institucionesService.crear(body, req.usuarioAuth);
  }

  //Endpoint para listar todas las instituciones activas (público para login)
  @Get()
  async listar() {
    return await this.institucionesService.listar();
  }

  //Endpoint para listar instituciones según rol autenticado
  @Get('todas')
  @RequierePermisos(PERMISOS.INSTITUCIONES_VER)
  async listarTodas(@Req() req: any) {
    return await this.institucionesService.listarTodas(req.usuarioAuth);
  }

  //Endpoint para obtener una institucion por su id
  @Get(':id')
  @RequierePermisos(PERMISOS.INSTITUCIONES_VER)
  async obtenerPorId(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.institucionesService.obtenerPorId(Number(id), req.usuarioAuth);
  }

  //Endpoint para actualizar una institucion por su id
  @Put(':id')
  @RequierePermisos(PERMISOS.INSTITUCIONES_EDITAR)
  async actualizar(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: ActualizarInstitucionDto,
    @Req() req: any,
  ) {
    return await this.institucionesService.actualizar(Number(id), body, req.usuarioAuth);
  }

  //Endpoint para inactivar una institucion por su id
  @Patch(':id/inactivar')
  @RequierePermisos(PERMISOS.INSTITUCIONES_CAMBIAR_ESTADO)
  async inactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.institucionesService.inactivar(Number(id), req.usuarioAuth);
  }

  //Endpoint para reactivar una institucion por su id
  @Patch(':id/reactivar')
  @RequierePermisos(PERMISOS.INSTITUCIONES_CAMBIAR_ESTADO)
  async reactivar(@Param('id', ParseIntPipe) id: string, @Req() req: any) {
    return await this.institucionesService.reactivar(Number(id), req.usuarioAuth);
  }

  //Endpoint para subir logo de institución (solo superadministrador)
  @Post('subir-logo')
  @RequierePermisos(PERMISOS.INSTITUCIONES_CREAR, PERMISOS.INSTITUCIONES_EDITAR)
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
