import { useState } from 'react';
import './dashboard.css';
import { Instituciones } from '../instituciones/instituciones';

export function Dashboard() {
  const [menuAbierto, setMenuAbierto] = useState(
    window.innerWidth > 900,
  );
  const [mostrarBotonAbrir, setMostrarBotonAbrir] = useState(false);
  const [moduloActivo, setModuloActivo] = useState< 'inicio' | 'dashboard' | 'instituciones'>('dashboard');

  const usuarioGuardado = localStorage.getItem('usuario');
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

  function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.reload();
  }

  function abrirMenu() {
    setMostrarBotonAbrir(false);
    setMenuAbierto(true);
  }

  function cerrarMenu() {
    setMenuAbierto(false);

    setTimeout(() => {
      setMostrarBotonAbrir(true);
    }, 350);
  }

  return (
    <main className={`dashboard-page ${menuAbierto ? 'menu-open' : 'menu-closed'}`}>

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
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside className={`sidebar ${menuAbierto ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">AI</div>

          <div className="sidebar-user-info">
            <h3>{usuario?.institucion?.nombre || 'Institución'}</h3>
            <p>
              {usuario?.nombres || 'Usuario'} {usuario?.apellidos || ''}
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

          <button
            className={
              moduloActivo === 'inicio' ? 'active' : ''
            }
            onClick={() => setModuloActivo('inicio')}
          >
            Inicio
          </button>

          <button
            className={
              moduloActivo === 'instituciones'
                ? 'active'
                : ''
            }
            onClick={() =>
              setModuloActivo('instituciones')
            }
          >
            Instituciones
          </button>

          <button>Usuarios</button>
          <button>Recursos</button>
          <button>Foros</button>
          <button>Rutas</button>
          <button>Reportes</button>
        </nav>

        <button className="logout-button" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </aside>

      <section className="dashboard-content">
        {moduloActivo === 'inicio' && (
          <div className="institution-watermark">
            <div className="institution-logo-placeholder">
              {usuario?.institucion?.logo ? (
                <img
                  src={`http://localhost:3000${usuario.institucion.logo}`}
                  alt="Logo institución"
                />
              ) : (
                'Logo'
              )}
            </div>

            <h1>
              {usuario?.institucion?.nombre ||
                'Plataforma Estudiantil'}
            </h1>

            <p>
              Selecciona un módulo del menú lateral para
              comenzar.
            </p>
          </div>
        )}

        {moduloActivo === 'instituciones' && (
          <Instituciones />
        )}
      </section>

    </main>
  );
}