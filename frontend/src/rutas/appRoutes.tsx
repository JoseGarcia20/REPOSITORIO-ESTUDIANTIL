import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../paginas/login/login';
import { AppLayout } from '../componentes/layout/appLayout';
import { Inicio } from '../paginas/inicio/inicio';
import { Instituciones } from '../paginas/instituciones/instituciones';
import { Usuarios } from '../paginas/usuarios/usuarios';
import { Categorias } from '../paginas/categorias/categorias';
import { TiposRecursos } from '../paginas/tiposRecursos/tiposRecursos';
import { Recursos } from '../paginas/recursos/recursos';
import { RolesAdmin } from '../paginas/roles/roles';
import { PERMISOS, usuarioTienePermiso } from '../api/adminApi';
import { Reportes } from '../paginas/reportes/reportes';

function RutaProtegidaPorPermiso({
  permiso,
  children,
}: {
  permiso: string;
  children: ReactElement;
}) {
  if (!usuarioTienePermiso(permiso)) return <Navigate to="/inicio" replace />;
  return children;
}

export function AppRoutes() {
  const token = localStorage.getItem('token');

  if (!token) return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<Inicio />} />

          <Route
            path="/admin/instituciones"
            element={
              <RutaProtegidaPorPermiso permiso={PERMISOS.INSTITUCIONES_CREAR}>
                <Instituciones />
              </RutaProtegidaPorPermiso>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <RutaProtegidaPorPermiso permiso={PERMISOS.USUARIOS_VER}>
                <Usuarios />
              </RutaProtegidaPorPermiso>
            }
          />
          <Route
            path="/admin/categorias"
            element={
              <RutaProtegidaPorPermiso permiso={PERMISOS.CATEGORIAS_VER}>
                <Categorias />
              </RutaProtegidaPorPermiso>
            }
          />
          <Route
            path="/admin/tipos-recursos"
            element={
              <RutaProtegidaPorPermiso permiso={PERMISOS.TIPOS_RECURSOS_VER}>
                <TiposRecursos />
              </RutaProtegidaPorPermiso>
            }
          />
          <Route
            path="/admin/recursos"
            element={
              <RutaProtegidaPorPermiso permiso={PERMISOS.RECURSOS_CREAR}>
                <Recursos />
              </RutaProtegidaPorPermiso>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <RutaProtegidaPorPermiso permiso={PERMISOS.ROLES_VER}>
                <RolesAdmin />
              </RutaProtegidaPorPermiso>
            }
          />
          <Route
            path="/reportes"
            element={
              <RutaProtegidaPorPermiso permiso={PERMISOS.REPORTES_VER}>
                <Reportes />
              </RutaProtegidaPorPermiso>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
