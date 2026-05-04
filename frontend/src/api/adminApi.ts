const API_URL = 'http://localhost:3000';

function headers() {
  const token = localStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function crudFetch(path: string) {
  const r = await fetch(`${API_URL}${path}`, { headers: headers() });
  if (!r.ok) throw new Error('Error al cargar datos');
  return r.json();
}
export async function crudCreate(path: string, data: any) {
  const r = await fetch(`${API_URL}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  if (!r.ok) throw new Error('Error al crear registro');
  return r.json();
}
export async function crudUpdate(path: string, id: number, data: any) {
  const r = await fetch(`${API_URL}${path}/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
  if (!r.ok) throw new Error('Error al actualizar registro');
  return r.json();
}
export async function crudToggle(path: string, id: number, activar: boolean) {
  const accion = activar ? 'reactivar' : 'inactivar';
  const r = await fetch(`${API_URL}${path}/${id}/${accion}`, { method: 'PATCH', headers: { Authorization: headers().Authorization } });
  if (!r.ok) throw new Error('Error al cambiar estado');
  return r.json();
}
