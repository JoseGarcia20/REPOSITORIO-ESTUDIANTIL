import { useMemo } from 'react';

//Vista base temporal para los módulos administrativos protegidos por rol
export function ModuloAdmin({ titulo }: { titulo: string }) {
  const usuario = useMemo(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  }, []);

  return (
    <section>
      <h1>{titulo}</h1>
      <p>Módulo habilitado para superadministrador y administrador institucional.</p>
      <p>Institución actual: {usuario?.institucion?.nombre || 'No disponible'}</p>
    </section>
  );
}
