import { useState, useEffect, useRef, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  consultarAsistente,
  listarConversaciones,
  eliminarConversacion,
  PERMISOS,
  usuarioTienePermiso,
} from '../../api/adminApi';
import { CalificacionIa } from '../ia/calificacionIa';
import type {
  RecursoAsistente,
  FuenteWebAsistente,
  ConversacionChatDTO,
  RespuestaAsistente,
} from '../../api/adminApi';
import './chatbotWidget.css';

const APP_LOGO_SRC = '/logo-solo.png';

type MensajeChat = {
  id: number;
  tipo: 'usuario' | 'asistente';
  texto: string;
  recursos?: RecursoAsistente[];
  fuentesWeb?: FuenteWebAsistente[];
  pregunta?: string;
  calificable?: boolean;
};

export function ChatbotWidget() {
  const navigate = useNavigate();
  const puedeUsarAsistente = usuarioTienePermiso(PERMISOS.RECURSOS_VER);

  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [pregunta, setPregunta] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [conversacionId, setConversacionId] = useState<number | null>(null);
  const [conversaciones, setConversaciones] = useState<ConversacionChatDTO[]>(
    [],
  );
  const [mostrarSidebar, setMostrarSidebar] = useState(false);
  const [cargandoConversaciones, setCargandoConversaciones] = useState(false);

  const mensajesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes]);

  const cargarConversaciones = useCallback(async () => {
    setCargandoConversaciones(true);
    try {
      const lista = await listarConversaciones();
      setConversaciones(lista);
    } catch {
      // silencioso
    } finally {
      setCargandoConversaciones(false);
    }
  }, []);

  useEffect(() => {
    if (abierto) {
      cargarConversaciones();
    }
  }, [abierto, cargarConversaciones]);

  function iniciarNuevaConversacion() {
    setConversacionId(null);
    setMensajes([]);
    setMostrarSidebar(false);
  }

  async function seleccionarConversacion(conv: ConversacionChatDTO) {
    setConversacionId(conv.id);
    setMensajes([
      {
        id: 1,
        tipo: 'asistente',
        texto: `*Continuando conversación:* ${conv.titulo || 'Sin título'}\n\n${conv.resumen || ''}`,
        calificable: false,
      },
    ]);
    setMostrarSidebar(false);
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

    const historial = mensajes
      .filter((m) => m.tipo === 'usuario' || m.tipo === 'asistente')
      .slice(-6)
      .map((m) => ({
        rol: m.tipo as 'usuario' | 'asistente',
        contenido: m.texto,
      }));

    setMensajes((prev) => [...prev, mensajeUsuario]);
    setPregunta('');
    setConsultando(true);

    try {
      const respuesta: RespuestaAsistente = await consultarAsistente(
        texto,
        conversacionId,
        historial,
      );

      setConversacionId(respuesta.conversacionId);

      setMensajes((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          tipo: 'asistente',
          texto: respuesta.mensaje,
          recursos: respuesta.recursos,
          fuentesWeb: respuesta.fuentesWeb,
          pregunta: texto,
          calificable: true,
        },
      ]);

      cargarConversaciones();
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          tipo: 'asistente',
          texto:
            'No pude consultar el asistente en este momento. Intenta nuevamente.',
        },
      ]);
    } finally {
      setConsultando(false);
    }
  }

  async function borrarConversacion(id: number, event: React.MouseEvent) {
    event.stopPropagation();
    try {
      await eliminarConversacion(id);
      setConversaciones((prev) => prev.filter((c) => c.id !== id));
      if (conversacionId === id) {
        iniciarNuevaConversacion();
      }
    } catch {
      // silencioso
    }
  }

  function abrirRecurso(recurso: RecursoAsistente) {
    navigate(recurso.rutaRepositorio);
    setAbierto(false);
  }

  const tituloActual =
    conversaciones.find((c) => c.id === conversacionId)?.titulo ||
    'Nueva conversación';

  if (!puedeUsarAsistente) {
    return null;
  }

  return (
    <div className="chatbot-widget">
      {abierto && (
        <section className="chatbot-panel" aria-label="Asistente académico">
          <header className="chatbot-header">
            <div className="chatbot-header-left">
              <button
                className="chatbot-sidebar-toggle"
                onClick={() => setMostrarSidebar((prev) => !prev)}
                aria-label="Historial de conversaciones"
                title="Historial"
              >
                ☰
              </button>
              <div>
                <span>Asistente académico</span>
                <h2>{tituloActual}</h2>
              </div>
            </div>
            <div className="chatbot-header-right">
              <button
                className="chatbot-btn-nueva"
                onClick={iniciarNuevaConversacion}
                title="Nueva conversación"
                aria-label="Nueva conversación"
              >
                ✚
              </button>
              <button
                onClick={() => setAbierto(false)}
                aria-label="Cerrar chat"
              >
                ×
              </button>
            </div>
          </header>

          <div className="chatbot-body">
            {mostrarSidebar && (
              <aside className="chatbot-sidebar">
                <div className="chatbot-sidebar-header">
                  <h3>Conversaciones</h3>
                  <button
                    className="chatbot-btn-nueva"
                    onClick={() => {
                      iniciarNuevaConversacion();
                    }}
                    title="Nueva conversación"
                  >
                    ✚
                  </button>
                </div>
                {cargandoConversaciones ? (
                  <p className="chatbot-sidebar-loading">Cargando...</p>
                ) : conversaciones.length === 0 ? (
                  <p className="chatbot-sidebar-empty">
                    Sin conversaciones aún
                  </p>
                ) : (
                  <ul className="chatbot-sidebar-lista">
                    {conversaciones.map((conv) => (
                      <li
                        key={conv.id}
                        className={`chatbot-sidebar-item ${
                          conv.id === conversacionId ? 'activo' : ''
                        }`}
                        onClick={() => seleccionarConversacion(conv)}
                      >
                        <div className="chatbot-sidebar-item-content">
                          <span className="chatbot-sidebar-item-titulo">
                            {conv.titulo || 'Sin título'}
                          </span>
                          {conv.resumen && (
                            <span className="chatbot-sidebar-item-resumen">
                              {conv.resumen}
                            </span>
                          )}
                        </div>
                        <button
                          className="chatbot-sidebar-item-eliminar"
                          onClick={(e) => borrarConversacion(conv.id, e)}
                          title="Eliminar conversación"
                          aria-label={`Eliminar ${conv.titulo || 'conversación'}`}
                        >
                          🗑
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            )}

            <div className="chatbot-messages" ref={mensajesRef}>
              {mensajes.length === 0 && (
                <div className="chatbot-message asistente">
                  <p>
                    Hola. Soy NEXORA AI, tu tutor académico. Pregúntame sobre
                    cualquier tema educativo, te ayudaré con explicaciones y
                    recursos del repositorio.
                  </p>
                </div>
              )}

              {mensajes.map((mensaje) => (
                <div
                  className={`chatbot-message ${mensaje.tipo}`}
                  key={mensaje.id}
                >
                  <div className="chatbot-message-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {mensaje.texto}
                    </ReactMarkdown>
                  </div>

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

                  {mensaje.fuentesWeb && mensaje.fuentesWeb.length > 0 && (
                    <div className="chatbot-results">
                      {mensaje.fuentesWeb.map((fuente) => (
                        <a
                          key={fuente.enlace}
                          className="chatbot-resource chatbot-web-source"
                          href={fuente.enlace}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <strong>{fuente.titulo}</strong>
                          <small>{fuente.fuente || 'Fuente web'}</small>
                        </a>
                      ))}
                    </div>
                  )}

                  {mensaje.calificable && (
                    <CalificacionIa
                      key={mensaje.id}
                      titulo="¿Cómo calificas esta respuesta del tutor IA?"
                      descripcion="Valora si la explicación y los recursos sugeridos fueron útiles."
                      modulo="asistente"
                      funcionalidad="tutor_inteligente"
                      entidadTipo="chat_asistente"
                      metadata={{
                        pregunta: mensaje.pregunta,
                        recursos: mensaje.recursos?.length || 0,
                        fuentesWeb: mensaje.fuentesWeb?.length || 0,
                      }}
                    />
                  )}
                </div>
              ))}

              {consultando && (
                <div className="chatbot-message asistente">
                  <div className="chatbot-typing">
                    <span className="chatbot-typing-dot" />
                    <span className="chatbot-typing-dot" />
                    <span className="chatbot-typing-dot" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <form className="chatbot-form" onSubmit={enviarPregunta}>
            <input
              value={pregunta}
              onChange={(event) => setPregunta(event.target.value)}
              placeholder="Pregunta sobre cualquier tema educativo..."
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
