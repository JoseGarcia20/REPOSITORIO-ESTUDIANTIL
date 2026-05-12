import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';

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
      const rol = await this.prisma.rol.findUnique({
        where: { id: Number(payload?.rolId) },
        include: {
          permisos: {
            include: {
              permiso: true,
            },
          },
        },
      });

      if (!rol || !rol.estado) {
        throw new UnauthorizedException('Rol no válido o inactivo');
      }

      request.usuarioAuth = {
        ...payload,
        rol: rol.nombre,
        permisos: rol.permisos.map((item) => item.permiso.codigo),
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
