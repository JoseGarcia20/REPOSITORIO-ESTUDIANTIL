import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { PERMISOS, usuarioTienePermiso } from '../../api/adminApi';
import { ChatbotWidget } from '../chatbot/chatbotWidget';
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
  const [mostrarBotonAbrir, setMostrarBotonAbrir] = useState(
    window.innerWidth <= 900,
  );

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
    const items: MenuItem[] = [{ titulo: 'Inicio', ruta: '/inicio' }];
    const administracion: { titulo: string; ruta: string }[] = [];

    if (usuarioTienePermiso(PERMISOS.RECURSOS_VER)) {
      items.push({
        titulo: 'Repositorio',
        hijos: [
          { titulo: 'Gestor de recursos', ruta: '/repositorio/recursos' },
        ],
      });
    }

    if (usuarioTienePermiso(PERMISOS.INSTITUCIONES_CREAR)) {
      administracion.push({
        titulo: 'Instituciones',
        ruta: '/admin/instituciones',
      });
    }

    if (usuarioTienePermiso(PERMISOS.USUARIOS_VER)) {
      administracion.push({ titulo: 'Usuarios', ruta: '/admin/usuarios' });
    }

    if (usuarioTienePermiso(PERMISOS.CATEGORIAS_VER)) {
      administracion.push({ titulo: 'Categorías', ruta: '/admin/categorias' });
    }

    if (usuarioTienePermiso(PERMISOS.TIPOS_RECURSOS_VER)) {
      administracion.push({
        titulo: 'Tipos de recursos',
        ruta: '/admin/tipos-recursos',
      });
    }

    if (usuarioTienePermiso(PERMISOS.RECURSOS_CREAR)) {
      administracion.push({ titulo: 'Recursos', ruta: '/admin/recursos' });
    }

    if (usuarioTienePermiso(PERMISOS.ROLES_VER)) {
      administracion.push({ titulo: 'Roles', ruta: '/admin/roles' });
    }

    if (administracion.length > 0) {
      items.push({
        titulo: 'Administración',
        hijos: administracion,
      });
    }

    if (
      usuarioTienePermiso(PERMISOS.FOROS_VER) ||
      usuarioTienePermiso(PERMISOS.AULA_COLABORATIVA_VER)
    ) {
      const comunidad: { titulo: string; ruta: string }[] = [];

      if (usuarioTienePermiso(PERMISOS.FOROS_VER)) {
        comunidad.push({ titulo: 'Foros académicos', ruta: '/foros' });
      }

      if (usuarioTienePermiso(PERMISOS.AULA_COLABORATIVA_VER)) {
        comunidad.push({
          titulo: 'Aula Colaborativa',
          ruta: '/aula-colaborativa',
        });
      }

      items.push({
        titulo: 'Comunidad',
        hijos: comunidad,
      });
    }

    if (usuarioTienePermiso(PERMISOS.REPORTES_VER)) {
      items.push({
        titulo: 'Reportes',
        hijos: [{ titulo: 'Reportes generales', ruta: '/reportes' }],
      });
    }

    return items;
  }, [usuarioGuardado]);

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

      {menuAbierto && <div className="sidebar-overlay" onClick={cerrarMenu} />}

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
                  <span
                    className={`submenu-arrow ${abierto ? 'submenu-arrow-open' : ''}`}
                  >
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

      <ChatbotWidget />
    </main>
  );
}
