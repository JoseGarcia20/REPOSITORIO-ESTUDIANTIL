import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISOS_REQUERIDOS_KEY } from '../decoradores/requiere-permisos.decorator';
import { CodigoPermiso, tienePermiso } from '../utils/roles.util';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permisosRequeridos =
      this.reflector.getAllAndOverride<CodigoPermiso[]>(
        PERMISOS_REQUERIDOS_KEY,
        [context.getHandler(), context.getClass()],
      ) || [];

    if (permisosRequeridos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const usuarioAuth = request.usuarioAuth;

    const autorizado = permisosRequeridos.some((permiso) =>
      tienePermiso(usuarioAuth, permiso),
    );

    if (!autorizado) {
      throw new ForbiddenException('No tiene permisos para ejecutar esta acción');
    }

    return true;
  }
}
