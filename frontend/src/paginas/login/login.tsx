import { useEffect, useState } from 'react';
import { obtenerInstituciones } from '../../api/api';
import { login } from '../../api/api';
import './login.css';

type Institucion = {
  id: number;
  nombre: string;
};

export function Login() {
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [institucionId, setInstitucionId] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');

  useEffect(() => {
    async function cargarInstituciones() {
      try {
        const data = await obtenerInstituciones();
        setInstituciones(data);
      } catch (error) {
        console.error('Error cargando instituciones:', error);
      }
    }

    cargarInstituciones();
  }, []);

  async function manejarSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const data = await login({
        institucionId,
        usuario,
        contrasena,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      window.location.reload();

    } catch (error) {
      console.error('Error login:', error);
      alert('Credenciales incorrectas');
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-hero">
          <div className="hero-decoration circle-one"></div>
          <div className="hero-decoration circle-two"></div>

          <div className="hero-content">
            <h1>Tu aprendizaje empieza aquí</h1>
            <p>
              Accede a recursos académicos, rutas de aprendizaje y herramientas inteligentes.
            </p>
          </div>
        </div>

        <div className="login-form-container">
          <div className="login-logo">
            <span>AI</span>
          </div>

          <h2>Bienvenido de nuevo</h2>
          <p className="login-subtitle">Ingresa a tu institución educativa</p>

          <form className="login-form" onSubmit={manejarSubmit}>
            <div className="form-group">
              <label>Institución</label>
              <select
                value={institucionId}
                onChange={(e) => setInstitucionId(e.target.value)}
              >
                <option value="">Selecciona tu institución</option>

                {instituciones.map((institucion) => (
                  <option key={institucion.id} value={institucion.id}>
                    {institucion.nombre}
                  </option>
                ))}
              </select>
            </div>

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

            <div className="form-options">
              <label>
                <input type="checkbox" />
                Recordarme
              </label>

              <button type="button">¿Olvidaste tu contraseña?</button>
            </div>

            <button className="login-button" type="submit">
              Iniciar sesión
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}