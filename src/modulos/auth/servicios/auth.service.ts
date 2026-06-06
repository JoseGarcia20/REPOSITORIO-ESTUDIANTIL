import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { LoginSuperadminDto } from '../dto/login-superadmin.dto';
import { PERMISOS } from '../utils/roles.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto) {
    const usuario = await this.buscarUsuarioAutenticacion({
      institucionId: Number(data.institucionId),
      usuario: data.usuario,
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (this.esSuperadministrador(usuario)) {
      throw new UnauthorizedException(
        'Este usuario debe ingresar por el acceso de superadministrador',
      );
    }

    const contrasenaValida = await bcrypt.compare(
      data.contrasena,
      usuario.contrasena,
    );

    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const permisos = usuario.rol.permisos.map((item) => item.permiso.codigo);
    return await this.construirRespuestaSesion(usuario, permisos);
  }

  async loginSuperadmin(data: LoginSuperadminDto) {
    const usuario = await this.buscarUsuarioAutenticacion({
      usuario: data.usuario,
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!this.esSuperadministrador(usuario)) {
      throw new UnauthorizedException(
        'Este acceso es exclusivo para superadministradores',
      );
    }

    const contrasenaValida = await bcrypt.compare(
      data.contrasena,
      usuario.contrasena,
    );

    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const permisos = usuario.rol.permisos.map((item) => item.permiso.codigo);
    return await this.construirRespuestaSesion(usuario, permisos);
  }

  private async buscarUsuarioAutenticacion(data: {
    institucionId?: number;
    usuario: string;
  }) {
    return this.prisma.usuario.findFirst({
      where: {
        ...(typeof data.institucionId === 'number'
          ? { institucionId: data.institucionId }
          : {}),
        activo: true,
        OR: [{ correo: data.usuario }, { documento: data.usuario }],
      },
      include: {
        rol: {
          include: {
            permisos: {
              include: {
                permiso: true,
              },
            },
          },
        },
        institucion: true,
        gradoEscolar: true,
      },
    });
  }

  private esSuperadministrador(usuario: any) {
    const permisos = (usuario?.rol?.permisos || []).map(
      (item: any) => item.permiso.codigo,
    );
    const rol = String(usuario?.rol?.nombre || '').toLowerCase();

    return (
      permisos.includes(PERMISOS.SISTEMA_TOTAL) ||
      rol.includes('superadministrador')
    );
  }

  private async construirRespuestaSesion(usuario: any, permisos: string[]) {
    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      documento: usuario.documento,
      rolId: usuario.rolId,
      rol: usuario.rol.nombre,
      institucionId: usuario.institucionId,
      gradoEscolarId: usuario.gradoEscolarId,
      permisos,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      usuario: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        documento: usuario.documento,
        rol: {
          id: usuario.rol.id,
          nombre: usuario.rol.nombre,
        },
        permisos,
        institucion: {
          id: usuario.institucion.id,
          nombre: usuario.institucion.nombre,
          logo: usuario.institucion.logo,
        },
        gradoEscolar: usuario.gradoEscolar
          ? {
              id: usuario.gradoEscolar.id,
              nombre: usuario.gradoEscolar.nombre,
              codigo: usuario.gradoEscolar.codigo,
              orden: usuario.gradoEscolar.orden,
            }
          : null,
      },
    };
  }
}
