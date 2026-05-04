export const ROLES = {
  SUPERADMINISTRADOR: 'superadministrador',
  ADMINISTRADOR_INSTITUCIONAL: 'administrador institucional',
  DOCENTE: 'docente',
  ESTUDIANTE: 'estudiante',
} as const;

//Funcion para normalizar el texto del rol y evitar errores por mayúsculas/minúsculas
export function normalizarRol(rol?: string | null): string {
  return (rol || '').trim().toLowerCase();
}

//Funcion para validar si el usuario autenticado es superadministrador
export function esSuperadministrador(rol?: string | null): boolean {
  return normalizarRol(rol) === ROLES.SUPERADMINISTRADOR;
}

//Funcion para validar si el usuario autenticado es administrador institucional
export function esAdministradorInstitucional(rol?: string | null): boolean {
  return normalizarRol(rol) === ROLES.ADMINISTRADOR_INSTITUCIONAL;
}
