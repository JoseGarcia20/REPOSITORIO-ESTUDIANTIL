import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { CrearInstitucionDto } from '../dto/crear-institucion.dto';
import { ActualizarInstitucionDto } from '../dto/actualizar-institucion.dto';
import { AuditoriaService } from '../../auditoria/servicios/auditoria.service';
import {
  PERMISOS,
  tieneAccesoTotal,
  validarAlcanceInstitucional,
  validarPermiso,
} from '../../auth/utils/roles.util';

@Injectable()
export class InstitucionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async crear(data: CrearInstitucionDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.INSTITUCIONES_CREAR);

    const institucion = await this.prisma.institucion.create({
      data,
    });

    await this.auditoriaService.registrar(
      {
        entidad: 'institucion',
        entidadId: institucion.id,
        accion: 'creada',
        detalles: { nombre: institucion.nombre, codigo: institucion.codigo },
        institucionId: institucion.id,
      },
      usuarioAuth,
    );

    return institucion;
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
    const institucionAnterior = await this.obtenerPorId(id, usuarioAuth);

    const institucion = await this.prisma.institucion.update({
      where: { id },
      data,
    });

    const camposActualizados = Object.keys(data).filter((key) => {
      const valorAnterior = (institucionAnterior as any)[key];
      const valorNuevo = (data as any)[key];
      return valorNuevo !== undefined && valorAnterior !== valorNuevo;
    });

    await this.auditoriaService.registrar(
      {
        entidad: 'institucion',
        entidadId: id,
        accion: 'editada',
        detalles: {
          nombre: institucion.nombre,
          camposActualizados,
        },
        institucionId: id,
      },
      usuarioAuth,
    );

    return institucion;
  }

  async inactivar(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.INSTITUCIONES_CAMBIAR_ESTADO);
    await this.obtenerPorId(id, usuarioAuth);

    const institucion = await this.prisma.institucion.update({ where: { id }, data: { estado: false } });

    await this.auditoriaService.registrar(
      {
        entidad: 'institucion',
        entidadId: id,
        accion: 'inactivada',
        detalles: { nombre: institucion.nombre },
        institucionId: id,
      },
      usuarioAuth,
    );

    return institucion;
  }

  async reactivar(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.INSTITUCIONES_CAMBIAR_ESTADO);
    await this.obtenerPorId(id, usuarioAuth);

    const institucion = await this.prisma.institucion.update({ where: { id }, data: { estado: true } });

    await this.auditoriaService.registrar(
      {
        entidad: 'institucion',
        entidadId: id,
        accion: 'reactivada',
        detalles: { nombre: institucion.nombre },
        institucionId: id,
      },
      usuarioAuth,
    );

    return institucion;
  }

  async validarSubidaLogo(usuarioAuth: any, file: Express.Multer.File) {
    validarPermiso(usuarioAuth, PERMISOS.INSTITUCIONES_EDITAR);
    return { ruta: `/uploads/instituciones/${file.filename}` };
  }
}
