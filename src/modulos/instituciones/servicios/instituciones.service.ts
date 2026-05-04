import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { CrearInstitucionDto } from '../dto/crear-institucion.dto';
import { ActualizarInstitucionDto } from '../dto/actualizar-institucion.dto';

@Injectable()
export class InstitucionesService {
  constructor(private readonly prisma: PrismaService) {}

  // Funcion para leer desde base de datos el rol real del usuario autenticado usando su rolId
  private async obtenerRolUsuarioDesdeBD(usuarioAuth: any) {
    const rolUsuario = await this.prisma.rol.findUnique({
      where: { id: Number(usuarioAuth?.rolId) },
      select: { id: true, nombre: true },
    });

    if (!rolUsuario) {
      throw new ForbiddenException('No fue posible validar el rol del usuario autenticado');
    }

    return rolUsuario;
  }

  // Funcion para obtener desde base de datos el id de los roles clave de administracion
  private async obtenerRolesAdministrativosDesdeBD() {
    const roles = await this.prisma.rol.findMany({
      where: {
        nombre: {
          in: ['superadministrador', 'administrador institucional'],
          mode: 'insensitive',
        },
      },
      select: { id: true, nombre: true },
    });

    const rolSuperadministrador = roles.find((rol) => rol.nombre.toLowerCase() === 'superadministrador');
    const rolAdministradorInstitucional = roles.find((rol) => rol.nombre.toLowerCase() === 'administrador institucional');

    return {
      rolSuperadministradorId: rolSuperadministrador?.id,
      rolAdministradorInstitucionalId: rolAdministradorInstitucional?.id,
    };
  }

  // Funcion para validar permisos de superadministrador usando ids consultados en base de datos
  private async validarSuperadministrador(usuarioAuth: any) {
    const rolUsuario = await this.obtenerRolUsuarioDesdeBD(usuarioAuth);
    const { rolSuperadministradorId } = await this.obtenerRolesAdministrativosDesdeBD();

    if (!rolSuperadministradorId || rolUsuario.id !== rolSuperadministradorId) {
      throw new ForbiddenException('Solo el superadministrador puede ejecutar esta accion');
    }
  }

  // Funcion para la creacion de una nueva institucion
  async crear(data: CrearInstitucionDto, usuarioAuth: any) {
    await this.validarSuperadministrador(usuarioAuth);
    return await this.prisma.institucion.create({ data });
  }

  // Funcion para listar todas las instituciones activas
  async listar() {
    return await this.prisma.institucion.findMany({
      where: { estado: true },
      orderBy: { id: 'desc' },
    });
  }

  // Funcion para listar instituciones segun rol autenticado obtenido desde base de datos
  async listarTodas(usuarioAuth: any) {
    const rolUsuario = await this.obtenerRolUsuarioDesdeBD(usuarioAuth);
    const { rolSuperadministradorId, rolAdministradorInstitucionalId } = await this.obtenerRolesAdministrativosDesdeBD();

    if (rolUsuario.id === rolSuperadministradorId) {
      return await this.prisma.institucion.findMany({ orderBy: { id: 'desc' } });
    }

    if (rolUsuario.id === rolAdministradorInstitucionalId || !!rolUsuario.id) {
      return await this.prisma.institucion.findMany({
        where: { id: Number(usuarioAuth?.institucionId) },
      });
    }

    return [];
  }

  // Funcion para obtener una institucion por su id con filtro por institucion
  async obtenerPorId(id: number, usuarioAuth: any) {
    const rolUsuario = await this.obtenerRolUsuarioDesdeBD(usuarioAuth);
    const { rolSuperadministradorId } = await this.obtenerRolesAdministrativosDesdeBD();

    if (rolUsuario.id !== rolSuperadministradorId && Number(usuarioAuth?.institucionId) !== id) {
      throw new ForbiddenException('No tiene permisos para consultar esta institucion');
    }

    const institucion = await this.prisma.institucion.findUnique({ where: { id } });

    if (!institucion) {
      throw new NotFoundException(`Institucion con id ${id} no encontrada`);
    }

    return institucion;
  }

  // Funcion para actualizar una institucion por su id
  async actualizar(id: number, data: ActualizarInstitucionDto, usuarioAuth: any) {
    await this.validarSuperadministrador(usuarioAuth);
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.institucion.update({ where: { id }, data });
  }

  // Funcion para inactivar una institucion por su id
  async inactivar(id: number, usuarioAuth: any) {
    await this.validarSuperadministrador(usuarioAuth);
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.institucion.update({ where: { id }, data: { estado: false } });
  }

  // Funcion para reactivar una institucion por su id
  async reactivar(id: number, usuarioAuth: any) {
    await this.validarSuperadministrador(usuarioAuth);
    await this.obtenerPorId(id, usuarioAuth);
    return await this.prisma.institucion.update({ where: { id }, data: { estado: true } });
  }

  // Funcion para validar subida de logo
  async validarSubidaLogo(usuarioAuth: any, file: Express.Multer.File) {
    await this.validarSuperadministrador(usuarioAuth);
    return { ruta: `/uploads/instituciones/${file.filename}` };
  }
}
