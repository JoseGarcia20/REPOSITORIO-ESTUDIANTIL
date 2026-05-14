import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermisosGuard } from '../guards/permisos.guard';
import type { CodigoPermiso } from '../utils/roles.util';

export const PERMISOS_REQUERIDOS_KEY = 'permisos_requeridos';

export function RequierePermisos(...permisos: CodigoPermiso[]) {
  return applyDecorators(
    SetMetadata(PERMISOS_REQUERIDOS_KEY, permisos),
    UseGuards(JwtAuthGuard, PermisosGuard),
  );
}
