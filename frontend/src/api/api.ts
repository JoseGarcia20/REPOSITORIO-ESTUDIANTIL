const API_URL = 'http://localhost:3000';

export async function obtenerInstituciones() {
  const respuesta = await fetch(`${API_URL}/instituciones`);

  if (!respuesta.ok) {
    throw new Error('Error al obtener instituciones');
  }

  return respuesta.json();
}

export async function obtenerTodasInstituciones() {
  const respuesta = await fetch(`${API_URL}/instituciones/todas`);

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
    headers: {
      'Content-Type': 'application/json',
    },
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

  if (!respuesta.ok) {
    throw new Error('Credenciales incorrectas');
  }

  return respuesta.json();
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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!respuesta.ok) {
    throw new Error('Error al actualizar institución');
  }

  return respuesta.json();
}

export async function inactivarInstitucion(id: number) {
  const respuesta = await fetch(
    `${API_URL}/instituciones/${id}/inactivar`,
    {
      method: 'PATCH',
    },
  );

  if (!respuesta.ok) {
    throw new Error('No se pudo inactivar la institución');
  }

  return respuesta.json();
}

export async function reactivarInstitucion(id: number) {
  const respuesta = await fetch(
    `${API_URL}/instituciones/${id}/reactivar`,
    {
      method: 'PATCH',
    },
  );

  if (!respuesta.ok) {
    throw new Error('No se pudo reactivar la institución');
  }

  return respuesta.json();
}

export async function subirLogoInstitucion(
  archivo: File,
) {
  const formData = new FormData();
  formData.append('logo', archivo);

  const respuesta = await fetch(
    `${API_URL}/instituciones/subir-logo`,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!respuesta.ok) {
    throw new Error('No se pudo subir el logo');
  }

  return respuesta.json();
}