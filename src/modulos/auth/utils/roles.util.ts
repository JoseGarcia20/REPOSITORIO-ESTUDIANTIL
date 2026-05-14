import { ForbiddenException } from '@nestjs/common';

export const PERMISOS = {
  SISTEMA_TOTAL: 'sistema.total',

  INSTITUCIONES_VER: 'instituciones.ver',
  INSTITUCIONES_CREAR: 'instituciones.crear',
  INSTITUCIONES_EDITAR: 'instituciones.editar',
  INSTITUCIONES_CAMBIAR_ESTADO: 'instituciones.cambiar_estado',

  ROLES_VER: 'roles.ver',
  ROLES_CREAR: 'roles.crear',
  ROLES_EDITAR: 'roles.editar',
  ROLES_CAMBIAR_ESTADO: 'roles.cambiar_estado',

  USUARIOS_VER: 'usuarios.ver',
  USUARIOS_CREAR: 'usuarios.crear',
  USUARIOS_EDITAR: 'usuarios.editar',
  USUARIOS_CAMBIAR_ESTADO: 'usuarios.cambiar_estado',
  ESTUDIANTES_VER: 'estudiantes.ver',

  CATEGORIAS_VER: 'categorias.ver',
  CATEGORIAS_CREAR: 'categorias.crear',
  CATEGORIAS_EDITAR: 'categorias.editar',
  CATEGORIAS_CAMBIAR_ESTADO: 'categorias.cambiar_estado',

  TIPOS_RECURSOS_VER: 'tipos_recursos.ver',
  TIPOS_RECURSOS_CREAR: 'tipos_recursos.crear',
  TIPOS_RECURSOS_EDITAR: 'tipos_recursos.editar',
  TIPOS_RECURSOS_CAMBIAR_ESTADO: 'tipos_recursos.cambiar_estado',

  RECURSOS_VER: 'recursos.ver',
  RECURSOS_CREAR: 'recursos.crear',
  RECURSOS_EDITAR: 'recursos.editar',
  RECURSOS_CAMBIAR_ESTADO: 'recursos.cambiar_estado',
  RECURSOS_SUBIR_ARCHIVO: 'recursos.subir_archivo',

  FOROS_VER: 'foros.ver',
  FOROS_CREAR: 'foros.crear',
  FOROS_CREAR_PUBLICO: 'foros.crear_publico',
  FOROS_COMENTAR: 'foros.comentar',
  FOROS_CERRAR: 'foros.cerrar',

  REPORTES_VER: 'reportes.ver',
} as const;

export type CodigoPermiso = (typeof PERMISOS)[keyof typeof PERMISOS];

export type UsuarioAuthConPermisos = {
  sub?: number;
  rolId?: number;
  rol?: string;
  institucionId?: number;
  permisos?: string[];
};

export function tienePermiso(
  usuarioAuth: UsuarioAuthConPermisos | undefined | null,
  permiso: CodigoPermiso,
): boolean {
  const permisos = usuarioAuth?.permisos || [];
  return permisos.includes(PERMISOS.SISTEMA_TOTAL) || permisos.includes(permiso);
}

export function validarPermiso(
  usuarioAuth: UsuarioAuthConPermisos | undefined | null,
  permiso: CodigoPermiso,
) {
  if (!tienePermiso(usuarioAuth, permiso)) {
    throw new ForbiddenException('No tiene permisos para ejecutar esta acción');
  }
}

export function tieneAccesoTotal(
  usuarioAuth: UsuarioAuthConPermisos | undefined | null,
): boolean {
  return tienePermiso(usuarioAuth, PERMISOS.SISTEMA_TOTAL);
}

export function validarAlcanceInstitucional(
  usuarioAuth: UsuarioAuthConPermisos | undefined | null,
  institucionId: number,
) {
  if (tieneAccesoTotal(usuarioAuth)) {
    return;
  }

  if (Number(usuarioAuth?.institucionId) !== Number(institucionId)) {
    throw new ForbiddenException(
      'No tiene permisos para acceder a información de otra institución',
    );
  }
}
