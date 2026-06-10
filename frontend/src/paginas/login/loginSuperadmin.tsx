import { useState } from 'react';
import { loginSuperadmin } from '../../api/api';
import './login.css';
import { Link } from 'react-router-dom';

const APP_LOGO_SRC = '/logo-solo.png';

export function LoginSuperadmin() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');

  async function manejarSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    try {
      const data = await loginSuperadmin({
        usuario,
        contrasena,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      window.location.href = '/inicio';
    } catch (error) {
      console.error('Error login superadmin:', error);
      setError(error instanceof Error ? error.message : 'Credenciales incorrectas');
    }
  }

  return (
    <main className="login-page superadmin">
      <section className="login-card login-card-superadmin">
        <div className="login-hero">
          <div className="hero-decoration circle-one"></div>
          <div className="hero-decoration circle-two"></div>

          <div className="hero-content">
            <h1>NEXORA AI</h1>
            <p>
              Acceso global para administración total de la plataforma.
            </p>
          </div>
        </div>

        <div className="login-form-container">
          <div className="login-logo">
            <img src={APP_LOGO_SRC} alt="NEXORA AI" />
          </div>

          <h2>Ingreso superadministrador</h2>
          <p className="login-subtitle">
            Usa tus credenciales globales sin seleccionar institución.
          </p>

          <form className="login-form" onSubmit={manejarSubmit}>
            <div className="form-group">
              <label>Correo o documento</label>
              <input
                type="text"
                placeholder="Ingresa tu correo o documento"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
            </div>

            <button className="login-button" type="submit">
              Iniciar sesión global
            </button>

            {error ? <div className="login-error">{error}</div> : null}
          </form>

          <div className="login-links">
            <span>¿Eres Usuario?</span>
            <Link to="/login">Ingresar al acceso de usuarios</Link>
          </div>

        </div>
      </section>
    </main>
  );
}
