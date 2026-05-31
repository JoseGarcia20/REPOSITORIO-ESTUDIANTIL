import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import * as bcrypt from 'bcryptjs';
import { AuditoriaService } from '../../auditoria/servicios/auditoria.service';
import {
  PERMISOS,
  tieneAccesoTotal,
  validarAlcanceInstitucional,
  validarPermiso,
} from '../../auth/utils/roles.util';
import {
  ConsultaPaginada,
  obtenerPaginacion,
  respuestaPaginada,
  valorBooleano,
} from '../../../comun/paginacion';

@Injectable()
export class UsuarioService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private readonly usuarioSelect = {
    id: true,
    nombres: true,
    apellidos: true,
    correo: true,
    tipoDocumento: true,
    documento: true,
    fechaNacimiento: true,
    genero: true,
    foto: true,
    activo: true,
    ultimoAcceso: true,
    createdAt: true,
    updatedAt: true,
    institucionId: true,
    rolId: true,
    gradoEscolarId: true,
    gradoEscolar: {
      select: {
        id: true,
        nombre: true,
        codigo: true,
        orden: true,
      },
    },
  } satisfies Prisma.UsuarioSelect;

  private construirFiltroUsuarios(
    usuarioAuth: any,
    query: ConsultaPaginada,
    soloActivos: boolean,
    busqueda?: string,
  ): Prisma.UsuarioWhereInput {
    const esGlobal = tieneAccesoTotal(usuarioAuth);
    const where: Prisma.UsuarioWhereInput = {
      ...(soloActivos ? { activo: true } : {}),
      ...(esGlobal ? {} : { institucionId: Number(usuarioAuth?.institucionId) }),
    };

    const estado = valorBooleano(query.estado);
    if (!soloActivos && estado !== undefined) {
      where.activo = estado;
    }

    if (esGlobal && query.institucionId) {
      where.institucionId = Number(query.institucionId);
    }

    if (query.rolId) {
      where.rolId = Number(query.rolId);
    }

    if (query.gradoEscolarId) {
      where.gradoEscolarId = Number(query.gradoEscolarId);
    }

    if (busqueda) {
      where.OR = [
        { nombres: { contains: busqueda, mode: 'insensitive' } },
        { apellidos: { contains: busqueda, mode: 'insensitive' } },
        { correo: { contains: busqueda, mode: 'insensitive' } },
        { documento: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async validarRolAsignable(rolId: number, usuarioAuth: any) {
    if (tieneAccesoTotal(usuarioAuth)) {
      return;
    }

    const rol = await this.prisma.rol.findUnique({
      where: { id: rolId },
      include: {
        permisos: {
          include: {
            permiso: true,
          },
        },
      },
    });

    if (!rol) {
      throw new ForbiddenException('Rol no válido');
    }

    const asignaAccesoTotal = rol.permisos.some(
      (item) => item.permiso.codigo === PERMISOS.SISTEMA_TOTAL,
    );

    if (asignaAccesoTotal) {
      throw new ForbiddenException('No puede asignar un rol de acceso total');
    }
  }

  async crear(data: CrearUsuarioDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_CREAR);
    await this.validarRolAsignable(data.rolId, usuarioAuth);

    try {
      const contrasenaEncriptada = await bcrypt.hash(data.contrasena, 10);
      const usuario = await this.prisma.usuario.create({
        data: {
          ...data,
          institucionId: tieneAccesoTotal(usuarioAuth) ? data.institucionId : Number(usuarioAuth?.institucionId),
          fechaNacimiento: new Date(data.fechaNacimiento),
          contrasena: contrasenaEncriptada,
        },
        select: this.usuarioSelect,
      });

      await this.auditoriaService.registrar(
        {
          entidad: 'usuario',
          entidadId: usuario.id,
          accion: 'creado',
          detalles: {
            usuario: `${usuario.nombres} ${usuario.apellidos}`,
            correo: usuario.correo,
            rolId: usuario.rolId,
            institucionId: usuario.institucionId,
          },
          institucionId: usuario.institucionId,
        },
        usuarioAuth,
      );

      return usuario;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe un usuario con ese dato único');
      }
      throw error;
    }
  }

  async listar(usuarioAuth: any, query: ConsultaPaginada = {}) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_VER);
    const { pagina, limite, skip, busqueda } = obtenerPaginacion(query);
    const where = this.construirFiltroUsuarios(
      usuarioAuth,
      query,
      true,
      busqueda,
    );

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        select: this.usuarioSelect,
        orderBy: { id: 'desc' },
        skip,
        take: limite,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return respuestaPaginada(data, total, pagina, limite);
  }

  async listarTodos(usuarioAuth: any, query: ConsultaPaginada = {}) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_VER);
    const { pagina, limite, skip, busqueda } = obtenerPaginacion(query);
    const where = this.construirFiltroUsuarios(
      usuarioAuth,
      query,
      false,
      busqueda,
    );

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        select: this.usuarioSelect,
        orderBy: { id: 'desc' },
        skip,
        take: limite,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return respuestaPaginada(data, total, pagina, limite);
  }

  async obtenerPorId(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_VER);
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: this.usuarioSelect,
    });
    if (!usuario) throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    validarAlcanceInstitucional(usuarioAuth, usuario.institucionId);
    return usuario;
  }

  async actualizar(id: number, data: ActualizarUsuarioDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_EDITAR);
    const usuarioAnterior = await this.obtenerPorId(id, usuarioAuth);

    if (data.rolId) {
      await this.validarRolAsignable(data.rolId, usuarioAuth);
    }

    const payload = {
      ...data,
      institucionId: tieneAccesoTotal(usuarioAuth)
        ? data.institucionId
        : undefined,
      fechaNacimiento: data.fechaNacimiento
        ? new Date(data.fechaNacimiento)
        : undefined,
    };

    const usuarioActualizado = await this.prisma.usuario.update({
      where: { id },
      data: payload,
      select: this.usuarioSelect,
    });

    const excludedKeys = ['institucionId', 'contrasena'];
    const camposActualizados = Object.keys(data).filter((key) => {
      if (excludedKeys.includes(key)) return false;
      const valorAnterior = (usuarioAnterior as any)[key];
      const valorNuevo = (data as any)[key];
      if (key === 'fechaNacimiento') {
        if (!valorNuevo) return false;
        return new Date(valorAnterior).toISOString().slice(0, 10) !== new Date(valorNuevo).toISOString().slice(0, 10);
      }
      return valorNuevo !== undefined && valorAnterior !== valorNuevo;
    });

    const cambiosSensibles: Record<string, unknown> = {};
    if (data.rolId && data.rolId !== usuarioAnterior.rolId) {
      cambiosSensibles.rolId = { anterior: usuarioAnterior.rolId, nuevo: data.rolId };
    }
    if (data.institucionId && data.institucionId !== usuarioAnterior.institucionId) {
      cambiosSensibles.institucionId = { anterior: usuarioAnterior.institucionId, nuevo: data.institucionId };
    }

    await this.auditoriaService.registrar(
      {
        entidad: 'usuario',
        entidadId: id,
        accion: 'editado',
        detalles: {
          usuario: `${usuarioAnterior.nombres} ${usuarioAnterior.apellidos}`,
          correo: usuarioAnterior.correo,
          camposActualizados,
          ...(Object.keys(cambiosSensibles).length > 0 ? { cambiosSensibles } : {}),
        },
        institucionId: usuarioActualizado.institucionId,
      },
      usuarioAuth,
    );

    return usuarioActualizado;
  }

  async inactivar(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_CAMBIAR_ESTADO);
    const usuario = await this.obtenerPorId(id, usuarioAuth);
    const resultado = await this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
      select: this.usuarioSelect,
    });

    await this.auditoriaService.registrar(
      {
        entidad: 'usuario',
        entidadId: id,
        accion: 'inactivado',
        detalles: { usuario: `${usuario.nombres} ${usuario.apellidos}`, correo: usuario.correo },
        institucionId: usuario.institucionId,
      },
      usuarioAuth,
    );

    return resultado;
  }

  async reactivar(id: number, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.USUARIOS_CAMBIAR_ESTADO);
    const usuario = await this.obtenerPorId(id, usuarioAuth);
    const resultado = await this.prisma.usuario.update({
      where: { id },
      data: { activo: true },
      select: this.usuarioSelect,
    });

    await this.auditoriaService.registrar(
      {
        entidad: 'usuario',
        entidadId: id,
        accion: 'reactivado',
        detalles: { usuario: `${usuario.nombres} ${usuario.apellidos}`, correo: usuario.correo },
        institucionId: usuario.institucionId,
      },
      usuarioAuth,
    );

    return resultado;
  }
}
