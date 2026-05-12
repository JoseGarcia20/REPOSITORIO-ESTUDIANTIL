import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { CrearInstitucionDto } from '../dto/crear-institucion.dto';
import { ActualizarInstitucionDto } from '../dto/actualizar-institucion.dto';
import {
  PERMISOS,
  tieneAccesoTotal,
  validarAlcanceInstitucional,
  validarPermiso,
} from '../../auth/utils/roles.util';

@Injectable()
export class InstitucionesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(data: CrearInstitucionDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.INSTITUCIONES_CREAR);

    return await this.prisma.institucion.create({
      data,
    });
  }

  async listar() {
    return await this.prisma.institucion.findMany({
      where: { estado: true },
      orderBy: { id: 'desc' },
    });
  }

  async listarTodas(usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.INSTITUCIONES_VER);

    if (tieneAccesoTotal(usuarioAuth)) {
      return await this.prisma.institucion.findMany({ orderBy: { id: 'desc' } });
    }

    return await this.prisma.institucion.findMany({
      where: { id: Number(usuarioAuth?.institucionId) },
    });
  }

  async obtenerPorId(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.INSTITUCIONES_VER);
    validarAlcanceInstitucional(usuarioAuth, id);

    const institucion = await this.prisma.institucion.findUnique({ where: { id } });
    if (!institucion) throw new NotFoundException(`Institucion con id ${id} no encontrada`);
    return institucion;
  }

  async actualizar(id: number, data: ActualizarInstitucionDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.INSTITUCIONES_EDITAR);
    await this.obtenerPorId(id, usuarioAuth);

    return await this.prisma.institucion.update({
      where: { id },
      data,
    });
  }

  async inactivar(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.INSTITUCIONES_CAMBIAR_ESTADO);
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.institucion.update({ where: { id }, data: { estado: false } });
  }

  async reactivar(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.INSTITUCIONES_CAMBIAR_ESTADO);
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.institucion.update({ where: { id }, data: { estado: true } });
  }

  async validarSubidaLogo(usuarioAuth: any, file: Express.Multer.File) {
    validarPermiso(usuarioAuth, PERMISOS.INSTITUCIONES_EDITAR);
    return { ruta: `/uploads/instituciones/${file.filename}` };
  }
}
