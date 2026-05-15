import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        institucionId: Number(data.institucionId),
        activo: true,
        OR: [
          { correo: data.usuario },
          { documento: data.usuario },
        ],
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

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const contrasenaValida = await bcrypt.compare(
      data.contrasena,
      usuario.contrasena,
    );

    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const permisos = usuario.rol.permisos.map((item) => item.permiso.codigo);

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
