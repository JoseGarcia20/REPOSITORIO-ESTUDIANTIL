const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000';

export type RespuestaLogin = {
  token: string;
  usuario: {
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
    documento: string;
    rol: {
      id: number;
      nombre: string;
    };
    permisos: string[];
    institucion: {
      id: number;
      nombre: string;
      logo?: string | null;
    };
    gradoEscolar: {
      id: number;
      nombre: string;
      codigo: string;
      orden: number;
    } | null;
  };
};

//Funcion para obtener el token guardado en localStorage
function obtenerToken(): string {
  return localStorage.getItem('token') || '';
}

export function construirUrlArchivoProtegido(ruta?: string | null): string {
  if (!ruta) {
    return '';
  }

  if (/^https?:\/\//i.test(ruta)) {
    return anexarTokenSiEsUpload(ruta);
  }

  const url = `${API_URL}${ruta}`;
  if (!ruta.startsWith('/uploads/')) {
    return url;
  }

  return anexarTokenSiEsUpload(url);
}

function anexarTokenSiEsUpload(url: string): string {
  let esUpload = false;
  let tieneToken = false;

  try {
    const urlParseada = new URL(url);
    esUpload = urlParseada.pathname.startsWith('/uploads/');
    tieneToken = urlParseada.searchParams.has('token');
  } catch {
    esUpload = url.startsWith('/uploads/');
    tieneToken = /[?&]token=/.test(url);
  }

  if (!esUpload || tieneToken) {
    return url;
  }

  const token = obtenerToken();
  if (!token) {
    return url;
  }

  const separador = url.includes('?') ? '&' : '?';
  return `${url}${separador}token=${encodeURIComponent(token)}`;
}

//Funcion para construir headers con autorización JWT cuando sea necesario
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
    let mensajeDetalle = '';

    try {
      const detalle = await respuesta.json();
      mensajeDetalle = Array.isArray(detalle?.message)
        ? detalle.message.join(', ')
        : detalle?.message || detalle?.error;
    } catch {
      mensajeDetalle = '';
    }

    throw new Error(
      mensajeDetalle ? `${mensajeError}: ${mensajeDetalle}` : mensajeError,
    );
  }

  return respuesta.json() as Promise<T>;
}

export async function obtenerInstituciones() {
  const respuesta = await fetch(`${API_URL}/instituciones`);

  if (!respuesta.ok) {
    throw new Error('Error al obtener instituciones');
  }

  return respuesta.json();
}

export async function obtenerTodasInstituciones() {
  const respuesta = await fetch(`${API_URL}/instituciones/todas`, {
    //Se envía el token para pasar el guard JWT del backend
    headers: construirHeadersAutorizados(false),
  });

  if (!respuesta.ok) {
    throw new Error('Error al obtener todas las instituciones');
  }

  return respuesta.json();
}

export async function crearInstitucion(data: {
  nombre: string;
  codigo: string;
  nit: string;
  correo: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  sitioWeb?: string;
  logo?: string;
}) {
  const respuesta = await fetch(`${API_URL}/instituciones`, {
    method: 'POST',
    //Se envía token porque este endpoint está protegido
    headers: construirHeadersAutorizados(),
    body: JSON.stringify(data),
  });

  if (!respuesta.ok) {
    throw new Error('Error al crear institución');
  }

  return respuesta.json();
}

export async function login(data: {
  institucionId: string;
  usuario: string;
  contrasena: string;
}) {
  const respuesta = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return procesarRespuesta<RespuestaLogin>(
    respuesta,
    'No se pudo iniciar sesión',
  );
}

export async function loginSuperadmin(data: {
  usuario: string;
  contrasena: string;
}) {
  const respuesta = await fetch(`${API_URL}/auth/superadmin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return procesarRespuesta<RespuestaLogin>(
    respuesta,
    'No se pudo iniciar sesión como superadministrador',
  );
}

export async function actualizarInstitucion(
  id: number,
  data: {
    nombre: string;
    codigo: string;
    nit: string;
    correo: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    sitioWeb?: string;
    logo?: string;
  },
) {
  const respuesta = await fetch(`${API_URL}/instituciones/${id}`, {
    method: 'PUT',
    //Se envía token porque este endpoint está protegido
    headers: construirHeadersAutorizados(),
    body: JSON.stringify(data),
  });

  if (!respuesta.ok) {
    throw new Error('Error al actualizar institución');
  }

  return respuesta.json();
}

export async function inactivarInstitucion(id: number) {
  const respuesta = await fetch(`${API_URL}/instituciones/${id}/inactivar`, {
    method: 'PATCH',
    //Se envía token porque este endpoint está protegido
    headers: construirHeadersAutorizados(false),
  });

  if (!respuesta.ok) {
    throw new Error('No se pudo inactivar la institución');
  }

  return respuesta.json();
}

export async function reactivarInstitucion(id: number) {
  const respuesta = await fetch(`${API_URL}/instituciones/${id}/reactivar`, {
    method: 'PATCH',
    //Se envía token porque este endpoint está protegido
    headers: construirHeadersAutorizados(false),
  });

  if (!respuesta.ok) {
    throw new Error('No se pudo reactivar la institución');
  }

  return respuesta.json();
}

export async function subirLogoInstitucion(archivo: File) {
  const formData = new FormData();
  formData.append('logo', archivo);

  const respuesta = await fetch(`${API_URL}/instituciones/subir-logo`, {
    method: 'POST',
    //Se envía token sin content-type manual porque FormData lo gestiona automáticamente
    headers: construirHeadersAutorizados(false),
    body: formData,
  });

  if (!respuesta.ok) {
    throw new Error('No se pudo subir el logo');
  }

  return respuesta.json();
}
