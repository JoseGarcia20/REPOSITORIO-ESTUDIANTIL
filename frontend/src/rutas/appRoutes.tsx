import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../paginas/login/login';
import { AppLayout } from '../componentes/layout/appLayout';
import { Inicio } from '../paginas/inicio/inicio';
import { Instituciones } from '../paginas/instituciones/instituciones';

//Funcion para validar acceso a rutas según el rol autenticado
function RutaProtegidaPorRol({
  permitido,
  rol,
  children,
}: {
  permitido: string[];
  rol: string;
  children: ReactElement;
}) {
  if (!permitido.includes(rol)) {
    return <Navigate to="/inicio" replace />;
  }

  return children;
}

export function AppRoutes() {
  const token = localStorage.getItem('token');
  const usuarioGuardado = localStorage.getItem('usuario');
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const rol = (usuario?.rol?.nombre || '').toLowerCase();

  if (!token) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<Inicio />} />

          <Route
            path="/admin/instituciones"
            element={
              <RutaProtegidaPorRol permitido={['superadministrador']} rol={rol}>
                <Instituciones />
              </RutaProtegidaPorRol>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
