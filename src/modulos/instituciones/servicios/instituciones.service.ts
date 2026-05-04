import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearInstitucionDto } from '../dto/crear-institucion.dto';
import { ActualizarInstitucionDto } from '../dto/actualizar-institucion.dto';
import { esSuperadministrador } from '../../auth/utils/roles.util';

@Injectable()
export class InstitucionesService {

  constructor(private readonly prisma: PrismaService) {}

  //Funcion para validar permisos de superadministrador
  private validarSuperadministrador(usuarioAuth: any) {
    if (!esSuperadministrador(usuarioAuth?.rol)) {
      throw new ForbiddenException('Solo el superadministrador puede ejecutar esta acción');
    }
  }

  //Funcion para la creacion de una nueva institucion
  async crear(data: CrearInstitucionDto, usuarioAuth: any) {
    this.validarSuperadministrador(usuarioAuth);
    try {
      return await this.prisma.institucion.create({ data });
    } catch (error) { throw error; }
  }

  //Funcion para listar todas las instituciones
  async listar() {
    return await this.prisma.institucion.findMany({ where: { estado: true }, orderBy: { id: 'desc' } });
  }

  //Funcion para listar instituciones según rol autenticado
  async listarTodas(usuarioAuth: any) {
    if (esSuperadministrador(usuarioAuth?.rol)) {
      return await this.prisma.institucion.findMany({ orderBy: { id: 'desc' } });
    }

    return await this.prisma.institucion.findMany({ where: { id: Number(usuarioAuth?.institucionId) } });
  }

  //Funcion para obtener una institucion por su id con filtro por institución
  async obtenerPorId(id: number, usuarioAuth: any) {
    if (!esSuperadministrador(usuarioAuth?.rol) && Number(usuarioAuth?.institucionId) !== id) {
      throw new ForbiddenException('No tiene permisos para consultar esta institución');
    }

    const institucion = await this.prisma.institucion.findUnique({ where: { id } });
    if (!institucion) throw new NotFoundException(`Institucion con id ${id} no encontrada`);
    return institucion;
  }

  //Funcion para actualizar una institucion por su id
  async actualizar(id: number, data: ActualizarInstitucionDto, usuarioAuth: any) {
    this.validarSuperadministrador(usuarioAuth);
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.institucion.update({ where: { id }, data });
  }

  //Funcion para inactivar una institucion por su id
  async inactivar(id: number, usuarioAuth: any) {
    this.validarSuperadministrador(usuarioAuth);
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.institucion.update({ where: { id }, data: { estado: false } });
  }

  //Funcion para reactivar una institucion por su id
  async reactivar(id: number, usuarioAuth: any) {
    this.validarSuperadministrador(usuarioAuth);
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.institucion.update({ where: { id }, data: { estado: true } });
  }

  //Funcion para validar subida de logo
  validarSubidaLogo(usuarioAuth: any, file: Express.Multer.File) {
    this.validarSuperadministrador(usuarioAuth);
    return { ruta: `/uploads/instituciones/${file.filename}` };
  }
}
