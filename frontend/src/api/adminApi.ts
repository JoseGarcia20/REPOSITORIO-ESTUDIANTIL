export const API_URL = 'http://localhost:3000';

export type InstitucionCatalogo = {
  id: number;
  nombre: string;
  estado?: boolean;
};

export type Rol = {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: boolean;
};

export type Categoria = {
  id: number;
  nombre: string;
  descripcion: string;
  color?: string;
  estado: boolean;
  institucionId: number;
};

export type TipoRecurso = {
  id: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  estado: boolean;
};

export type UsuarioAdmin = {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  tipoDocumento: string;
  documento: string;
  fechaNacimiento: string;
  genero: string;
  foto?: string;
  activo: boolean;
  institucionId: number;
  rolId: number;
};

export type Recurso = {
  id: number;
  titulo: string;
  palabrasClave?: string;
  contenidoResumen?: string;
  rutaRecurso?: string;
  urlRecurso?: string;
  fuente?: string;
  autorNombre?: string;
  nivelAcademico?: string;
  estado: boolean;
  publicado: boolean;
  institucionId: number;
  categoriaId: number;
  tipoRecursoId: number;
  usuarioCreadorId: number;
};

export type UsuarioSesion = {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  documento: string;
  rol: {
    id: number;
    nombre: string;
  };
  permisos?: string[];
  institucion: {
    id: number;
    nombre: string;
    logo?: string;
  };
};

export type CrearUsuarioPayload = {
  nombres: string;
  apellidos: string;
  correo: string;
  tipoDocumento: string;
  documento: string;
  fechaNacimiento: string;
  genero: string;
  contrasena: string;
  institucionId: number;
  rolId: number;
};

export type ActualizarUsuarioPayload = Omit<
  CrearUsuarioPayload,
  'contrasena'
>;

export type CategoriaPayload = {
  nombre: string;
  descripcion: string;
  color: string;
  institucionId?: number;
};

export type TipoRecursoPayload = {
  nombre: string;
  descripcion?: string;
  icono?: string;
};

export type RolPayload = {
  nombre: string;
  descripcion?: string;
};

export type RecursoPayload = {
  titulo: string;
  palabrasClave?: string;
  contenidoResumen?: string;
  rutaRecurso?: string;
  urlRecurso?: string;
  fuente?: string;
  autorNombre?: string;
  nivelAcademico?: string;
  publicado?: boolean;
  institucionId?: number;
  categoriaId: number;
  tipoRecursoId: number;
  usuarioCreadorId: number;
};

type RutaEstado = 'inactivar' | 'reactivar';

export const PERMISOS = {
  SISTEMA_TOTAL: 'sistema.total',
  INSTITUCIONES_VER: 'instituciones.ver',
  INSTITUCIONES_CREAR: 'instituciones.crear',
  ROLES_VER: 'roles.ver',
  USUARIOS_VER: 'usuarios.ver',
  CATEGORIAS_VER: 'categorias.ver',
  TIPOS_RECURSOS_VER: 'tipos_recursos.ver',
  RECURSOS_VER: 'recursos.ver',
  RECURSOS_CREAR: 'recursos.crear',
  REPORTES_VER: 'reportes.ver',
} as const;

function obtenerToken(): string {
  return localStorage.getItem('token') || '';
}

function construirHeadersAutorizados(incluirJson = true): HeadersInit {
  const token = obtenerToken();

  return {
    ...(incluirJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function procesarRespuesta<T>(
  respuesta: Response,
  mensajeError: string,
): Promise<T> {
  if (!respuesta.ok) {
    throw new Error(mensajeError);
  }

  return respuesta.json() as Promise<T>;
}

async function get<T>(path: string, mensajeError: string): Promise<T> {
  const respuesta = await fetch(`${API_URL}${path}`, {
    headers: construirHeadersAutorizados(false),
  });

  return procesarRespuesta<T>(respuesta, mensajeError);
}

async function post<T>(
  path: string,
  data: unknown,
  mensajeError: string,
): Promise<T> {
  const respuesta = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: construirHeadersAutorizados(),
    body: JSON.stringify(data),
  });

  return procesarRespuesta<T>(respuesta, mensajeError);
}

async function put<T>(
  path: string,
  data: unknown,
  mensajeError: string,
): Promise<T> {
  const respuesta = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: construirHeadersAutorizados(),
    body: JSON.stringify(data),
  });

  return procesarRespuesta<T>(respuesta, mensajeError);
}

async function patch<T>(
  path: string,
  mensajeError: string,
): Promise<T> {
  const respuesta = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: construirHeadersAutorizados(false),
  });

  return procesarRespuesta<T>(respuesta, mensajeError);
}

function cambiarEstado<T>(
  path: string,
  id: number,
  accion: RutaEstado,
): Promise<T> {
  return patch<T>(
    `${path}/${id}/${accion}`,
    'Error al cambiar el estado del registro',
  );
}

export function obtenerUsuarioAutenticado(): UsuarioSesion | null {
  const usuarioGuardado = localStorage.getItem('usuario');

  if (!usuarioGuardado) {
    return null;
  }

  try {
    return JSON.parse(usuarioGuardado) as UsuarioSesion;
  } catch {
    return null;
  }
}

export function esSuperadministrador(): boolean {
  return usuarioTienePermiso(PERMISOS.SISTEMA_TOTAL);
}

export function usuarioTienePermiso(permiso: string): boolean {
  const usuario = obtenerUsuarioAutenticado();
  const permisos = usuario?.permisos || [];
  return permisos.includes(PERMISOS.SISTEMA_TOTAL) || permisos.includes(permiso);
}

export function obtenerInstitucionesAdmin() {
  return get<InstitucionCatalogo[]>(
    '/instituciones/todas',
    'Error al obtener instituciones',
  );
}

export function obtenerRolesAdmin() {
  return get<Rol[]>('/roles/todos', 'Error al obtener roles');
}

export function obtenerRolesAsignablesAdmin() {
  return get<Rol[]>('/roles/asignables', 'Error al obtener roles asignables');
}

export function crearRol(data: RolPayload) {
  return post<Rol>('/roles', data, 'Error al crear rol');
}

export function actualizarRol(id: number, data: RolPayload) {
  return put<Rol>(`/roles/${id}`, data, 'Error al actualizar rol');
}

export function inactivarRol(id: number) {
  return cambiarEstado<Rol>('/roles', id, 'inactivar');
}

export function reactivarRol(id: number) {
  return cambiarEstado<Rol>('/roles', id, 'reactivar');
}

export function obtenerCategoriasAdmin() {
  return get<Categoria[]>('/categorias/todas', 'Error al obtener categorías');
}

export function crearCategoria(data: CategoriaPayload) {
  return post<Categoria>('/categorias', data, 'Error al crear categoría');
}

export function actualizarCategoria(id: number, data: CategoriaPayload) {
  return put<Categoria>(
    `/categorias/${id}`,
    data,
    'Error al actualizar categoría',
  );
}

export function inactivarCategoria(id: number) {
  return cambiarEstado<Categoria>('/categorias', id, 'inactivar');
}

export function reactivarCategoria(id: number) {
  return cambiarEstado<Categoria>('/categorias', id, 'reactivar');
}

export function obtenerTiposRecursosAdmin() {
  return get<TipoRecurso[]>(
    '/tipos-recursos/todos',
    'Error al obtener tipos de recursos',
  );
}

export function crearTipoRecurso(data: TipoRecursoPayload) {
  return post<TipoRecurso>(
    '/tipos-recursos',
    data,
    'Error al crear tipo de recurso',
  );
}

export function actualizarTipoRecurso(
  id: number,
  data: TipoRecursoPayload,
) {
  return put<TipoRecurso>(
    `/tipos-recursos/${id}`,
    data,
    'Error al actualizar tipo de recurso',
  );
}

export function inactivarTipoRecurso(id: number) {
  return cambiarEstado<TipoRecurso>('/tipos-recursos', id, 'inactivar');
}

export function reactivarTipoRecurso(id: number) {
  return cambiarEstado<TipoRecurso>('/tipos-recursos', id, 'reactivar');
}

export function obtenerUsuariosAdmin() {
  return get<UsuarioAdmin[]>('/usuarios/todos', 'Error al obtener usuarios');
}

export function crearUsuarioAdmin(data: CrearUsuarioPayload) {
  return post<UsuarioAdmin>('/usuarios', data, 'Error al crear usuario');
}

export function actualizarUsuarioAdmin(
  id: number,
  data: ActualizarUsuarioPayload,
) {
  return put<UsuarioAdmin>(
    `/usuarios/${id}`,
    data,
    'Error al actualizar usuario',
  );
}

export function inactivarUsuarioAdmin(id: number) {
  return cambiarEstado<UsuarioAdmin>('/usuarios', id, 'inactivar');
}

export function reactivarUsuarioAdmin(id: number) {
  return cambiarEstado<UsuarioAdmin>('/usuarios', id, 'reactivar');
}

export function obtenerRecursosAdmin() {
  return get<Recurso[]>('/recursos/todos', 'Error al obtener recursos');
}

export function crearRecurso(data: RecursoPayload) {
  return post<Recurso>('/recursos', data, 'Error al crear recurso');
}

export function actualizarRecurso(id: number, data: RecursoPayload) {
  return put<Recurso>(`/recursos/${id}`, data, 'Error al actualizar recurso');
}

export function inactivarRecurso(id: number) {
  return cambiarEstado<Recurso>('/recursos', id, 'inactivar');
}

export function reactivarRecurso(id: number) {
  return cambiarEstado<Recurso>('/recursos', id, 'reactivar');
}

export async function subirArchivoRecurso(archivo: File) {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const respuesta = await fetch(`${API_URL}/recursos/subir-archivo`, {
    method: 'POST',
    headers: construirHeadersAutorizados(false),
    body: formData,
  });

  return procesarRespuesta<{ ruta: string }>(
    respuesta,
    'Error al subir archivo de recurso',
  );
}

export function crudFetch(path: string) {
  return get<any>(path, 'Error al cargar datos');
}

export function crudCreate(path: string, data: any) {
  return post<any>(path, data, 'Error al crear registro');
}

export function crudUpdate(path: string, id: number, data: any) {
  return put<any>(`${path}/${id}`, data, 'Error al actualizar registro');
}

export function crudToggle(path: string, id: number, activar: boolean) {
  return cambiarEstado<any>(path, id, activar ? 'reactivar' : 'inactivar');
}
