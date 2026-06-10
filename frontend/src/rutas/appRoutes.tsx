import { lazy, Suspense } from 'react';
import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  obtenerUsuarioAutenticado,
  PERMISOS,
  usuarioTienePermiso,
} from '../api/adminApi';

const Login = lazy(() =>
  import('../paginas/login/login').then((modulo) => ({
    default: modulo.Login,
  })),
);
const LoginSuperadmin = lazy(() =>
  import('../paginas/login/loginSuperadmin').then((modulo) => ({
    default: modulo.LoginSuperadmin,
  })),
);
const AppLayout = lazy(() =>
  import('../componentes/layout/appLayout').then((modulo) => ({
    default: modulo.AppLayout,
  })),
);
const Inicio = lazy(() =>
  import('../paginas/inicio/inicio').then((modulo) => ({
    default: modulo.Inicio,
  })),
);
const Instituciones = lazy(() =>
  import('../paginas/instituciones/instituciones').then((modulo) => ({
    default: modulo.Instituciones,
  })),
);
const Usuarios = lazy(() =>
  import('../paginas/usuarios/usuarios').then((modulo) => ({
    default: modulo.Usuarios,
  })),
);
const Categorias = lazy(() =>
  import('../paginas/categorias/categorias').then((modulo) => ({
    default: modulo.Categorias,
  })),
);
const TiposRecursos = lazy(() =>
  import('../paginas/tiposRecursos/tiposRecursos').then((modulo) => ({
    default: modulo.TiposRecursos,
  })),
);
const Recursos = lazy(() =>
  import('../paginas/recursos/recursos').then((modulo) => ({
    default: modulo.Recursos,
  })),
);
const RolesAdmin = lazy(() =>
  import('../paginas/roles/roles').then((modulo) => ({
    default: modulo.RolesAdmin,
  })),
);
const Reportes = lazy(() =>
  import('../paginas/reportes/reportes').then((modulo) => ({
    default: modulo.Reportes,
  })),
);
const Foros = lazy(() =>
  import('../paginas/foros/foros').then((modulo) => ({
    default: modulo.Foros,
  })),
);
const GestorRecursos = lazy(() =>
  import('../paginas/repositorio/gestorRecursos').then((modulo) => ({
    default: modulo.GestorRecursos,
  })),
);
const AulaColaborativa = lazy(() =>
  import('../paginas/aulaColaborativa/aulaColaborativa').then((modulo) => ({
    default: modulo.AulaColaborativa,
  })),
);
const PreparadorIa = lazy(() =>
  import('../paginas/preparadorIa/preparadorIa').then((modulo) => ({
    default: modulo.PreparadorIa,
  })),
);
const AprendizajeAdaptativo = lazy(() =>
  import('../paginas/aprendizajeAdaptativo/aprendizajeAdaptativo').then(
    (modulo) => ({
      default: modulo.AprendizajeAdaptativo,
    }),
  ),
);
const RutasAprendizajeAdmin = lazy(() =>
  import('../paginas/rutasAprendizajeAdmin/rutasAprendizajeAdmin').then(
    (modulo) => ({
      default: modulo.RutasAprendizajeAdmin,
    }),
  ),
);
const Auditoria = lazy(() =>
  import('../paginas/auditoria/auditoria').then((modulo) => ({
    default: modulo.Auditoria,
  })),
);

function CargandoRuta() {
  return (
    <div
      style={{
        alignItems: 'center',
        background: '#f5f6fb',
        color: '#070738',
        display: 'flex',
        fontWeight: 900,
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      Cargando...
    </div>
  );
}

function RutaProtegidaPorPermiso({
  permiso,
  permisos,
  rolesBloqueados = [],
  children,
}: {
  permiso?: string;
  permisos?: string[];
  rolesBloqueados?: string[];
  children: ReactElement;
}) {
  const usuario = obtenerUsuarioAutenticado();
  const rol = usuario?.rol?.nombre?.toLowerCase();
  if (rol && rolesBloqueados.includes(rol)) {
    return <Navigate to="/inicio" replace />;
  }
  const permisosValidos = permisos || (permiso ? [permiso] : []);
  if (!permisosValidos.some((item) => usuarioTienePermiso(item))) {
    return <Navigate to="/inicio" replace />;
  }
  return children;
}

export function AppRoutes() {
  const token = localStorage.getItem('token');

  if (!token)
    return (
      <BrowserRouter>
        <Suspense fallback={<CargandoRuta />}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/superadmin"
              element={<Navigate to="/superadmin/login" replace />}
            />
            <Route path="/superadmin/login" element={<LoginSuperadmin />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    );

  return (
    <BrowserRouter>
      <Suspense fallback={<CargandoRuta />}>
        <Routes>
          <Route path="/login" element={<Navigate to="/inicio" replace />} />
          <Route
            path="/superadmin/login"
            element={<Navigate to="/inicio" replace />}
          />
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route element={<AppLayout />}>
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
              path="/admin/rutas-aprendizaje"
              element={
                <RutaProtegidaPorPermiso permiso={PERMISOS.SISTEMA_TOTAL}>
                  <RutasAprendizajeAdmin />
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
              path="/aprendizaje-adaptativo"
              element={
                <RutaProtegidaPorPermiso
                  permisos={[
                    PERMISOS.FOROS_VER,
                    PERMISOS.RECURSOS_VER,
                    PERMISOS.PREPARADOR_IA_USAR,
                  ]}
                >
                  <AprendizajeAdaptativo />
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
                <RutaProtegidaPorPermiso
                  permiso={PERMISOS.AULA_COLABORATIVA_VER}
                >
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
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
