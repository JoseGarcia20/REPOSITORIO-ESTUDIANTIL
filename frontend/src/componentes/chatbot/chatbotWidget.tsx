import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  consultarAsistente,
  PERMISOS,
  usuarioTienePermiso,
} from '../../api/adminApi';
import type { RecursoAsistente } from '../../api/adminApi';
import './chatbotWidget.css';

const APP_LOGO_SRC = '/logo-solo.png';

type MensajeChat = {
  id: number;
  tipo: 'usuario' | 'asistente';
  texto: string;
  recursos?: RecursoAsistente[];
};

const mensajeInicial: MensajeChat = {
  id: 1,
  tipo: 'asistente',
  texto:
    'Hola. Puedo ayudarte a encontrar recursos del repositorio. Pregúntame por un tema, una materia o una actividad.',
};

export function ChatbotWidget() {
  const navigate = useNavigate();
  const puedeUsarAsistente = usuarioTienePermiso(PERMISOS.RECURSOS_VER);
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([mensajeInicial]);
  const [pregunta, setPregunta] = useState('');
  const [consultando, setConsultando] = useState(false);

  if (!puedeUsarAsistente) {
    return null;
  }

  async function enviarPregunta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const texto = pregunta.trim();

    if (!texto || consultando) {
      return;
    }

    const mensajeUsuario: MensajeChat = {
      id: Date.now(),
      tipo: 'usuario',
      texto,
    };

    setMensajes((prev) => [...prev, mensajeUsuario]);
    setPregunta('');

    try {
      setConsultando(true);
      const respuesta = await consultarAsistente(texto);
      setMensajes((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          tipo: 'asistente',
          texto: respuesta.mensaje,
          recursos: respuesta.recursos,
        },
      ]);
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          tipo: 'asistente',
          texto:
            'No pude consultar el repositorio en este momento. Intenta nuevamente.',
        },
      ]);
    } finally {
      setConsultando(false);
    }
  }

  function abrirRecurso(recurso: RecursoAsistente) {
    navigate(recurso.rutaRepositorio);
    setAbierto(false);
  }

  return (
    <div className="chatbot-widget">
      {abierto && (
        <section className="chatbot-panel" aria-label="Asistente académico">
          <header className="chatbot-header">
            <div>
              <span>Asistente académico</span>
              <h2>Buscador inteligente</h2>
            </div>
            <button onClick={() => setAbierto(false)} aria-label="Cerrar chat">
              ×
            </button>
          </header>

          <div className="chatbot-messages">
            {mensajes.map((mensaje) => (
              <div
                className={`chatbot-message ${mensaje.tipo}`}
                key={mensaje.id}
              >
                <p>{mensaje.texto}</p>

                {mensaje.recursos && mensaje.recursos.length > 0 && (
                  <div className="chatbot-results">
                    {mensaje.recursos.map((recurso) => (
                      <button
                        key={recurso.id}
                        className="chatbot-resource"
                        onClick={() => abrirRecurso(recurso)}
                      >
                        <strong>{recurso.titulo}</strong>
                        <small>
                          {[recurso.categoria, recurso.gradoEscolar]
                            .filter(Boolean)
                            .join(' · ') || 'Recurso disponible'}
                        </small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {consultando && (
              <div className="chatbot-message asistente">
                <p>Buscando recursos relacionados...</p>
              </div>
            )}
          </div>

          <form className="chatbot-form" onSubmit={enviarPregunta}>
            <input
              value={pregunta}
              onChange={(event) => setPregunta(event.target.value)}
              placeholder="Ej: recursos para fracciones matemáticas"
              maxLength={500}
            />
            <button type="submit" disabled={consultando || !pregunta.trim()}>
              Enviar
            </button>
          </form>
        </section>
      )}

      <button
        className="chatbot-fab"
        onClick={() => setAbierto((prev) => !prev)}
        aria-label="Abrir asistente académico"
      >
        <img src={APP_LOGO_SRC} alt="NEXORA AI" />
      </button>
    </div>
  );
}
