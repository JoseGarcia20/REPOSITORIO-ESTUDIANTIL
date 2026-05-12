import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearRecursoDto } from '../dto/crear-recurso.dto';
import { ActualizarRecursoDto } from '../dto/actualizar-recurso.dto';
import {
  PERMISOS,
  tieneAccesoTotal,
  validarAlcanceInstitucional,
  validarPermiso,
} from '../../auth/utils/roles.util';

@Injectable()
export class RecursoService {
  constructor(private readonly prisma: PrismaService) {}
  async crear(data: CrearRecursoDto, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.RECURSOS_CREAR); try { return await this.prisma.recurso.create({ data: { ...data, institucionId: tieneAccesoTotal(usuarioAuth) ? data.institucionId : Number(usuarioAuth?.institucionId) } }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Ya existe un recurso con ese dato único.'); throw error; } }
  async listar(usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.RECURSOS_VER); const esGlobal = tieneAccesoTotal(usuarioAuth); return await this.prisma.recurso.findMany({ where: { estado: true, ...(esGlobal ? {} : { institucionId: Number(usuarioAuth?.institucionId) }) }, orderBy: { id: 'desc' } }); }
  async listarTodos(usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.RECURSOS_VER); const esGlobal = tieneAccesoTotal(usuarioAuth); return await this.prisma.recurso.findMany({ where: esGlobal ? {} : { institucionId: Number(usuarioAuth?.institucionId) }, orderBy: { id: 'desc' } }); }
  async obtenerPorId(id: number, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.RECURSOS_VER); const recurso = await this.prisma.recurso.findUnique({ where: { id } }); if (!recurso) throw new NotFoundException(`Recurso con id ${id} no encontrado`); validarAlcanceInstitucional(usuarioAuth, recurso.institucionId); return recurso; }
  async actualizar(id: number, data: ActualizarRecursoDto, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.RECURSOS_EDITAR); await this.obtenerPorId(id, usuarioAuth); const payload = tieneAccesoTotal(usuarioAuth) ? data : { ...data, institucionId: undefined }; return await this.prisma.recurso.update({ where: { id }, data: payload }); }
  async inactivar(id: number, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.RECURSOS_CAMBIAR_ESTADO); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.recurso.update({ where: { id }, data: { estado: false } }); }
  async reactivar(id: number, usuarioAuth: any) { validarPermiso(usuarioAuth, PERMISOS.RECURSOS_CAMBIAR_ESTADO); await this.obtenerPorId(id, usuarioAuth); return await this.prisma.recurso.update({ where: { id }, data: { estado: true } }); }
  async validarSubidaArchivo(usuarioAuth: any, file: Express.Multer.File) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_SUBIR_ARCHIVO);

    if (!file) {
      throw new BadRequestException('Debe enviar un archivo');
    }

    return { ruta: `/uploads/recursos/${file.filename}` };
  }
}
