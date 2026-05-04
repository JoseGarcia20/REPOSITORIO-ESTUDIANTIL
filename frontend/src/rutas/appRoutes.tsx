import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../paginas/login/login';
import { AppLayout } from '../componentes/layout/appLayout';
import { Inicio } from '../paginas/inicio/inicio';
import { Instituciones } from '../paginas/instituciones/instituciones';
import { CrudAdmin } from '../paginas/admin/crudAdmin';

function RutaProtegidaPorRol({
  permitido,
  rol,
  children,
}: {
  permitido: string[];
  rol: string;
  children: ReactElement;
}) {
  if (!permitido.includes(rol)) return <Navigate to="/inicio" replace />;
  return children;
}

export function AppRoutes() {
  const token = localStorage.getItem('token');
  const usuarioGuardado = localStorage.getItem('usuario');
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const rol = (usuario?.rol?.nombre || '').toLowerCase();
  const rolesAdmin = ['superadministrador', 'administrador institucional'];

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
              <RutaProtegidaPorRol permitido={['superadministrador']} rol={rol}>
                <Instituciones />
              </RutaProtegidaPorRol>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <RutaProtegidaPorRol permitido={rolesAdmin} rol={rol}>
                <CrudAdmin
                  titulo="Usuarios"
                  endpoint="/usuarios"
                  campos={[
                    { name: 'nombres', label: 'Nombres' },
                    { name: 'apellidos', label: 'Apellidos' },
                    { name: 'correo', label: 'Correo' },
                    { name: 'documento', label: 'Documento' },
                    { name: 'rolId', label: 'Rol ID', type: 'number' },
                    { name: 'institucionId', label: 'Institución ID', type: 'number' },
                    { name: 'tipoDocumento', label: 'Tipo Doc' },
                    { name: 'genero', label: 'Género' },
                    { name: 'fechaNacimiento', label: 'Fecha Nacimiento' },
                    { name: 'contrasena', label: 'Contraseña' },
                  ]}
                />
              </RutaProtegidaPorRol>
            }
          />
          <Route
            path="/admin/categorias"
            element={
              <RutaProtegidaPorRol permitido={rolesAdmin} rol={rol}>
                <CrudAdmin
                  titulo="Categorías"
                  endpoint="/categorias"
                  campos={[
                    { name: 'nombre', label: 'Nombre' },
                    { name: 'descripcion', label: 'Descripción' },
                    { name: 'color', label: 'Color' },
                    { name: 'institucionId', label: 'Institución ID', type: 'number' },
                  ]}
                />
              </RutaProtegidaPorRol>
            }
          />
          <Route
            path="/admin/tipos-recursos"
            element={
              <RutaProtegidaPorRol permitido={rolesAdmin} rol={rol}>
                <CrudAdmin
                  titulo="Tipos de recursos"
                  endpoint="/tipos-recursos"
                  campos={[
                    { name: 'nombre', label: 'Nombre' },
                    { name: 'descripcion', label: 'Descripción' },
                    { name: 'icono', label: 'Icono' },
                  ]}
                />
              </RutaProtegidaPorRol>
            }
          />
          <Route
            path="/admin/recursos"
            element={
              <RutaProtegidaPorRol permitido={rolesAdmin} rol={rol}>
                <CrudAdmin
                  titulo="Recursos"
                  endpoint="/recursos"
                  campos={[
                    { name: 'titulo', label: 'Título' },
                    { name: 'palabrasClave', label: 'Palabras clave' },
                    { name: 'categoriaId', label: 'Categoría ID', type: 'number' },
                    { name: 'tipoRecursoId', label: 'Tipo Recurso ID', type: 'number' },
                    { name: 'institucionId', label: 'Institución ID', type: 'number' },
                    { name: 'usuarioCreadorId', label: 'Usuario Creador ID', type: 'number' },
                  ]}
                />
              </RutaProtegidaPorRol>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <RutaProtegidaPorRol permitido={['superadministrador']} rol={rol}>
                <CrudAdmin
                  titulo="Roles"
                  endpoint="/roles"
                  campos={[
                    { name: 'nombre', label: 'Nombre' },
                    { name: 'descripcion', label: 'Descripción' },
                  ]}
                />
              </RutaProtegidaPorRol>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
