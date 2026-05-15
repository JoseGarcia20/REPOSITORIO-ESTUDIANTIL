import { NavLink } from 'react-router-dom';
import {
  API_URL,
  obtenerUsuarioAutenticado,
  PERMISOS,
  usuarioTienePermiso,
} from '../../api/adminApi';
import './inicio.css';

type AccesoDashboard = {
  titulo: string;
  descripcion: string;
  ruta: string;
  permiso: string;
  etiqueta: string;
};

const accesos: AccesoDashboard[] = [
  {
    titulo: 'Instituciones',
    descripcion: 'Control global de colegios, sedes y datos administrativos.',
    ruta: '/admin/instituciones',
    permiso: PERMISOS.INSTITUCIONES_VER,
    etiqueta: 'Sistema',
  },
  {
    titulo: 'Usuarios',
    descripcion: 'Gestión de estudiantes, docentes y personal institucional.',
    ruta: '/admin/usuarios',
    permiso: PERMISOS.USUARIOS_VER,
    etiqueta: 'Comunidad',
  },
  {
    titulo: 'Gestor de recursos',
    descripcion: 'Repositorio visual de archivos, enlaces y materiales educativos.',
    ruta: '/repositorio/recursos',
    permiso: PERMISOS.RECURSOS_VER,
    etiqueta: 'Aprendizaje',
  },
  {
    titulo: 'Maestro de recursos',
    descripcion: 'Administración de recursos, archivos y publicación de materiales.',
    ruta: '/admin/recursos',
    permiso: PERMISOS.RECURSOS_CREAR,
    etiqueta: 'Administración',
  },
  {
    titulo: 'Foros académicos',
    descripcion: 'Conversaciones, aportes y discusión entre instituciones.',
    ruta: '/foros',
    permiso: PERMISOS.FOROS_VER,
    etiqueta: 'Participación',
  },
  {
    titulo: 'Categorías',
    descripcion: 'Clasificación de contenidos por institución.',
    ruta: '/admin/categorias',
    permiso: PERMISOS.CATEGORIAS_VER,
    etiqueta: 'Catálogos',
  },
  {
    titulo: 'Tipos de recursos',
    descripcion: 'Definición de formatos y clases de material educativo.',
    ruta: '/admin/tipos-recursos',
    permiso: PERMISOS.TIPOS_RECURSOS_VER,
    etiqueta: 'Catálogos',
  },
  {
    titulo: 'Roles',
    descripcion: 'Base de permisos y perfiles funcionales del sistema.',
    ruta: '/admin/roles',
    permiso: PERMISOS.ROLES_VER,
    etiqueta: 'Seguridad',
  },
  {
    titulo: 'Reportes',
    descripcion: 'Información consolidada para seguimiento institucional.',
    ruta: '/reportes',
    permiso: PERMISOS.REPORTES_VER,
    etiqueta: 'Análisis',
  },
];

function describirAlcance(permisos: string[]) {
  if (permisos.includes(PERMISOS.SISTEMA_TOTAL)) {
    return 'Acceso total a todos los módulos e instituciones.';
  }

  if (permisos.includes(PERMISOS.USUARIOS_CREAR)) {
    return 'Administración completa dentro de la institución asignada.';
  }

  if (permisos.includes(PERMISOS.FOROS_CREAR_PUBLICO)) {
    return 'Participación docente con foros públicos e institucionales.';
  }

  if (permisos.includes(PERMISOS.REPORTES_VER)) {
    return 'Consulta de reportes y participación en foros disponibles.';
  }

  return 'Acceso académico a recursos y espacios habilitados.';
}

export function Inicio() {
  const usuario = obtenerUsuarioAutenticado();
  const permisos = usuario?.permisos || [];
  const logo = usuario?.institucion?.logo
    ? `${API_URL}${usuario.institucion.logo}`
    : null;

  const accesosVisibles = accesos.filter((acceso) =>
    usuarioTienePermiso(acceso.permiso),
  );

  return (
    <section className="inicio-page">
      <div className="inicio-hero">
        <div className="inicio-logo">
          {logo ? (
            <img src={logo} alt="Logo institución" />
          ) : (
            <span>{usuario?.institucion?.nombre?.charAt(0) || 'P'}</span>
          )}
        </div>

        <div className="inicio-heading">
          <span className="section-label">Panel inicial</span>
          <h1>{usuario?.institucion?.nombre || 'Plataforma Estudiantil'}</h1>
          <p>{describirAlcance(permisos)}</p>
        </div>

        <div className="inicio-role-card">
          <span>Rol activo</span>
          <strong>{usuario?.rol?.nombre || 'Usuario'}</strong>
          <small>
            {usuario?.nombres} {usuario?.apellidos}
          </small>
        </div>
      </div>

      <div className="inicio-grid">
        {accesosVisibles.map((acceso) => (
          <NavLink className="inicio-module" key={acceso.ruta} to={acceso.ruta}>
            <span>{acceso.etiqueta}</span>
            <h2>{acceso.titulo}</h2>
            <p>{acceso.descripcion}</p>
          </NavLink>
        ))}
      </div>
    </section>
  );
}
