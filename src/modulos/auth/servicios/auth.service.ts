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
        rol: true,
        institucion: true,
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

    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      documento: usuario.documento,
      rolId: usuario.rolId,
      rol: usuario.rol.nombre,
      institucionId: usuario.institucionId,
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
        rol: usuario.rol.nombre,
        institucion: {
          id: usuario.institucion.id,
          nombre: usuario.institucion.nombre,
          logo: usuario.institucion.logo,
        },
      },
    };
  }
}