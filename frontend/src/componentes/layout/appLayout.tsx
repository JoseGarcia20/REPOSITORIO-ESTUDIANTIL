import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import './appLayout.css';

type MenuItem = {
  titulo: string;
  ruta?: string;
  hijos?: {
    titulo: string;
    ruta: string;
  }[];
};

export function AppLayout() {
  const location = useLocation();

  const usuarioGuardado = localStorage.getItem('usuario');
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

  const [menuAbierto, setMenuAbierto] = useState(window.innerWidth > 900);
  const [mostrarBotonAbrir, setMostrarBotonAbrir] = useState(window.innerWidth <= 900);

  //Rol normalizado para construir menú por jerarquía
  const rol = usuario?.rol?.nombre?.toLowerCase() || 'estudiante';

  function cerrarMenu() {
    setMenuAbierto(false);
    setTimeout(() => {
      setMostrarBotonAbrir(true);
    }, 350);
  }

  function abrirMenu() {
    setMostrarBotonAbrir(false);
    setMenuAbierto(true);
  }

  const menu = useMemo<MenuItem[]>(() => {
    if (rol === 'estudiante') {
      return [
        { titulo: 'Inicio', ruta: '/inicio' },
        {
          titulo: 'Estudiantes',
          hijos: [
            { titulo: 'Foro académico', ruta: '/estudiantes/foros' },
            { titulo: 'Aprendizaje adaptativo', ruta: '/estudiantes/aprendizaje' },
          ],
        },
      ];
    }

    if (rol === 'docente') {
      return [
        { titulo: 'Inicio', ruta: '/inicio' },
        {
          titulo: 'Docentes',
          hijos: [
            { titulo: 'Seguimiento', ruta: '/docentes/seguimiento' },
            { titulo: 'Recursos', ruta: '/docentes/recursos' },
          ],
        },
      ];
    }

    return [
      { titulo: 'Inicio', ruta: '/inicio' },
      {
        titulo: 'Administración',
        hijos: [
          ...(rol === 'superadministrador'
            ? [{ titulo: 'Instituciones', ruta: '/admin/instituciones' }]
            : []),
          { titulo: 'Usuarios', ruta: '/admin/usuarios' },
          { titulo: 'Categorías', ruta: '/admin/categorias' },
          { titulo: 'Tipos de recursos', ruta: '/admin/tipos-recursos' },
          { titulo: 'Recursos', ruta: '/admin/recursos' },
          ...(rol === 'superadministrador' ? [{ titulo: 'Roles', ruta: '/admin/roles' }] : []),
          { titulo: 'Foros', ruta: '/admin/foros' },
        ],
      },
      {
        titulo: 'Reportes',
        hijos: [
          { titulo: 'Reportes generales', ruta: '/reportes' },
        ],
      },
    ];
  }, [rol]);

  const [submenuAbierto, setSubmenuAbierto] = useState<string | null>(null);

  useEffect(() => {
    const activo = menu.find((item) =>
      item.hijos?.some((hijo) => location.pathname.startsWith(hijo.ruta)),
    );
    if (activo) {
      setSubmenuAbierto(activo.titulo);
    }
  }, [location.pathname, menu]);

  useEffect(() => {
    if (window.innerWidth <= 900) {
      cerrarMenu();
    }
  }, [location.pathname]);

  function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.reload();
  }

  function alternarSubmenu(nombre: string) {
    setSubmenuAbierto((prev) => (prev === nombre ? null : nombre));
  }

  return (
    <main className={`dashboard-page ${menuAbierto ? 'menu-open' : ''}`}>
      {mostrarBotonAbrir && (
        <button
          className="menu-toggle-button"
          onClick={abrirMenu}
          aria-label="Abrir menú"
        >
          ☰
        </button>
      )}

      {menuAbierto && (
        <div
          className="sidebar-overlay"
          onClick={cerrarMenu}
        />
      )}

      <aside className={`sidebar ${menuAbierto ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">AI</div>

          <div className="sidebar-user-info">
            <h3>{usuario?.institucion?.nombre || 'Institución'}</h3>
            <p>
              {usuario?.nombres} {usuario?.apellidos}
            </p>
          </div>

          <button
            className="close-menu-button"
            onClick={cerrarMenu}
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>

        <nav className="sidebar-menu">
          {menu.map((item) => {
            if (item.ruta) {
              return (
                <NavLink key={item.titulo} to={item.ruta}>
                  {item.titulo}
                </NavLink>
              );
            }

            const abierto = submenuAbierto === item.titulo;

            return (
              <div key={item.titulo}>
                <button
                  className="submenu-button"
                  onClick={() => alternarSubmenu(item.titulo)}
                >
                  {item.titulo}
                  <span className={`submenu-arrow ${abierto ? 'submenu-arrow-open' : ''}`}>
                    ▾
                  </span>
                </button>

                <div className={`submenu ${abierto ? 'submenu-open' : ''}`}>
                  {item.hijos?.map((hijo) => (
                    <NavLink key={hijo.ruta} to={hijo.ruta}>
                      {hijo.titulo}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <button className="logout-button" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </aside>

      <section className="dashboard-content">
        <Outlet />
      </section>
    </main>
  );
}