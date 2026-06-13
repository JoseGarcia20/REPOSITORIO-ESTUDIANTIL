import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';

function ipV4(ip: string | undefined): string | null {
  if (!ip) return null;
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
  const match = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(ip);
  if (match) return match[1];
  if (ip.includes(':')) return null;
  return ip;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  //Guard para validar el token JWT en endpoints protegidos
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization as string | undefined;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authorization.replace('Bearer ', '').trim();

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: Number(payload?.sub) },
        select: {
          id: true,
          correo: true,
          documento: true,
          activo: true,
          institucionId: true,
          rolId: true,
          gradoEscolarId: true,
          rol: {
            include: {
              permisos: {
                include: {
                  permiso: true,
                },
              },
            },
          },
        },
      });

      if (!usuario || !usuario.activo || !usuario.rol.estado) {
        throw new UnauthorizedException('Rol no válido o inactivo');
      }

      request.usuarioAuth = {
        ...payload,
        id: usuario.id,
        sub: usuario.id,
        correo: usuario.correo,
        documento: usuario.documento,
        rolId: usuario.rolId,
        rol: usuario.rol.nombre,
        institucionId: usuario.institucionId,
        gradoEscolarId: usuario.gradoEscolarId,
        permisos: usuario.rol.permisos.map((item) => item.permiso.codigo),
        ip: ipV4(request.ip),
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
