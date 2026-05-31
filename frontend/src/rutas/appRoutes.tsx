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
import {
  obtenerUsuarioAutenticado,
  PERMISOS,
  usuarioTienePermiso,
} from '../api/adminApi';
import { Reportes } from '../paginas/reportes/reportes';
import { Foros } from '../paginas/foros/foros';
import { GestorRecursos } from '../paginas/repositorio/gestorRecursos';
import { AulaColaborativa } from '../paginas/aulaColaborativa/aulaColaborativa';
import { PreparadorIa } from '../paginas/preparadorIa/preparadorIa';
import { Auditoria } from '../paginas/auditoria/auditoria';

function RutaProtegidaPorPermiso({
  permiso,
  rolesBloqueados = [],
  children,
}: {
  permiso: string;
  rolesBloqueados?: string[];
  children: ReactElement;
}) {
  const usuario = obtenerUsuarioAutenticado();
  const rol = usuario?.rol?.nombre?.toLowerCase();
  if (rol && rolesBloqueados.includes(rol)) {
    return <Navigate to="/inicio" replace />;
  }
  if (!usuarioTienePermiso(permiso)) return <Navigate to="/inicio" replace />;
  return children;
}

export function AppRoutes() {
  const token = localStorage.getItem('token');

  if (!token)
    return (
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
              <RutaProtegidaPorPermiso
                permiso={PERMISOS.USUARIOS_VER}
                rolesBloqueados={['docente']}
              >
                <Navigate to="/admin/usuarios/estudiantes" replace />
              </RutaProtegidaPorPermiso>
            }
          />
          <Route
            path="/admin/usuarios/:submodulo"
            element={
              <RutaProtegidaPorPermiso
                permiso={PERMISOS.USUARIOS_VER}
                rolesBloqueados={['docente']}
              >
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
          <Route
            path="/preparador-ia"
            element={
              <RutaProtegidaPorPermiso permiso={PERMISOS.PREPARADOR_IA_USAR}>
                <PreparadorIa />
              </RutaProtegidaPorPermiso>
            }
          />
          <Route
            path="/foros"
            element={
              <RutaProtegidaPorPermiso permiso={PERMISOS.FOROS_VER}>
                <Foros />
              </RutaProtegidaPorPermiso>
            }
          />
          <Route
            path="/aula-colaborativa"
            element={
              <RutaProtegidaPorPermiso permiso={PERMISOS.AULA_COLABORATIVA_VER}>
                <AulaColaborativa />
              </RutaProtegidaPorPermiso>
            }
          />
          <Route
            path="/admin/auditoria"
            element={
              <RutaProtegidaPorPermiso permiso={PERMISOS.AUDITORIA_VER}>
                <Auditoria />
              </RutaProtegidaPorPermiso>
            }
          />
          <Route
            path="/repositorio/recursos"
            element={
              <RutaProtegidaPorPermiso permiso={PERMISOS.RECURSOS_VER}>
                <GestorRecursos />
              </RutaProtegidaPorPermiso>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
