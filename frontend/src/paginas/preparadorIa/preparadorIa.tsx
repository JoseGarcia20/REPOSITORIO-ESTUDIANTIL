import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { ReactNode } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import {
  API_URL,
  esSuperadministrador,
  generarMaterialIa,
  guardarMaterialIa,
  obtenerCatalogosPreparadorIa,
  obtenerRecursosRepositorio,
  obtenerUsuarioAutenticado,
} from '../../api/adminApi';
import { CalificacionIa } from '../../componentes/ia/calificacionIa';
import type {
  CatalogosPreparadorIa,
  ExtensionMaterialIa,
  MaterialIaGenerado,
  OrigenMaterialIa,
  Recurso,
  SeccionMaterialIa,
  TipoMaterialIa,
} from '../../api/adminApi';
import './preparadorIa.css';

type FormularioPreparador = {
  tema: string;
  institucionId: string;
  categoriaId: string;
  gradoEscolarId: string;
  tipoMaterial: TipoMaterialIa;
  origenContenido: OrigenMaterialIa;
  recursoFuenteId: string;
  extension: ExtensionMaterialIa;
  instruccionesAdicionales: string;
  tipoRecursoId: string;
  publicado: boolean;
};

const tiposMaterial: Array<{
  valor: TipoMaterialIa;
  label: string;
  descripcion: string;
}> = [
  {
    valor: 'guia_clase',
    label: 'Guía de clase',
    descripcion: 'Explicación, objetivos, desarrollo y actividad.',
  },
  {
    valor: 'taller',
    label: 'Taller',
    descripcion: 'Ejercicios, instrucciones y preguntas para resolver.',
  },
  {
    valor: 'quiz',
    label: 'Quiz',
    descripcion: 'Preguntas cortas para verificar comprensión rápida.',
  },
  {
    valor: 'lectura',
    label: 'Lectura guiada',
    descripcion: 'Texto académico adaptado al grado.',
  },
  {
    valor: 'evaluacion',
    label: 'Actividad evaluativa',
    descripcion: 'Preguntas y criterios para valorar comprensión.',
  },
  {
    valor: 'resumen',
    label: 'Resumen académico',
    descripcion: 'Síntesis organizada para explicación rápida.',
  },
];

const extensionesMaterial: Array<{
  valor: ExtensionMaterialIa;
  label: string;
}> = [
  { valor: 'breve', label: 'Breve' },
  { valor: 'normal', label: 'Normal' },
  { valor: 'extenso', label: 'Extenso' },
];

const catalogosVacios: CatalogosPreparadorIa = {
  instituciones: [],
  categorias: [],
  gradosEscolares: [],
  tiposRecursos: [],
};

const limiteTema = 1000;
const limiteInstrucciones = 2000;
const extensionesEvaluablesRepositorio = ['pdf', 'docx', 'xlsx', 'csv'];

type FragmentoMatematico =
  | { tipo: 'texto'; valor: string }
  | { tipo: 'bloque'; valor: string };

function textoUsuario() {
  const usuario = obtenerUsuarioAutenticado();
  return [usuario?.nombres, usuario?.apellidos].filter(Boolean).join(' ');
}

function tieneFormulaLatex(texto: string) {
  return /\$\$[\s\S]+?\$\$|\$[^$\n]+\$/.test(texto || '');
}

function normalizarLatex(texto: string) {
  return (texto || '').replace(/\\\\/g, '\\');
}

function extensionRecurso(recurso: Recurso) {
  const ruta = (recurso.rutaRecurso || '').split('?')[0].split('#')[0];
  const extension = ruta.split('.').pop()?.toLowerCase() || '';

  return extension === ruta ? '' : extension;
}

function esRecursoEvaluable(recurso: Recurso) {
  return (
    Boolean(recurso.rutaRecurso) &&
    extensionesEvaluablesRepositorio.includes(extensionRecurso(recurso))
  );
}

function separarBloquesMatematicos(texto: string) {
  const bloques: FragmentoMatematico[] = [];
  const regex = /\$\$([\s\S]+?)\$\$/g;
  let cursor = 0;
  let match = regex.exec(texto);

  while (match) {
    if (match.index > cursor) {
      bloques.push({
        tipo: 'texto',
        valor: texto.slice(cursor, match.index),
      });
    }

    bloques.push({
      tipo: 'bloque',
      valor: match[1].trim(),
    });
    cursor = regex.lastIndex;
    match = regex.exec(texto);
  }

  if (cursor < texto.length) {
    bloques.push({
      tipo: 'texto',
      valor: texto.slice(cursor),
    });
  }

  return bloques;
}

function renderizarLineaConFormula(
  linea: string,
  keyBase: string,
): ReactNode[] {
  const nodos: ReactNode[] = [];
  const regex = /\$([^$\n]+)\$/g;
  let cursor = 0;
  let indice = 0;
  let match = regex.exec(linea);

  while (match) {
    const previo = linea.slice(cursor, match.index);

    if (previo) {
      nodos.push(<span key={`${keyBase}-texto-${indice}`}>{previo}</span>);
    }

    nodos.push(
      <InlineMath
        key={`${keyBase}-math-${indice}`}
        math={normalizarLatex(match[1].trim())}
      />,
    );
    cursor = regex.lastIndex;
    indice += 1;
    match = regex.exec(linea);
  }

  const final = linea.slice(cursor);
  if (final) {
    nodos.push(<span key={`${keyBase}-final`}>{final}</span>);
  }

  return nodos;
}

function VistaMatematica({ texto }: { texto: string }) {
  if (!tieneFormulaLatex(texto)) {
    return null;
  }

  const bloques = separarBloquesMatematicos(texto);

  return (
    <div className="ai-math-render">
      <small>Vista matemática</small>
      {bloques.map((bloque, bloqueIndice) => {
        if (bloque.tipo === 'bloque') {
          return (
            <div className="ai-math-block" key={`bloque-${bloqueIndice}`}>
              <BlockMath math={normalizarLatex(bloque.valor)} />
            </div>
          );
        }

        return bloque.valor
          .split('\n')
          .filter((linea) => linea.trim().length > 0)
          .map((linea, lineaIndice) => (
            <p key={`linea-${bloqueIndice}-${lineaIndice}`}>
              {renderizarLineaConFormula(
                linea,
                `linea-${bloqueIndice}-${lineaIndice}`,
              )}
            </p>
          ));
      })}
    </div>
  );
}

function crearFormularioInicial(): FormularioPreparador {
  const usuario = obtenerUsuarioAutenticado();

  return {
    tema: '',
    institucionId: usuario?.institucion?.id
      ? String(usuario.institucion.id)
      : '',
    categoriaId: '',
    gradoEscolarId: usuario?.gradoEscolar?.id
      ? String(usuario.gradoEscolar.id)
      : '',
    tipoMaterial: 'guia_clase',
    origenContenido: 'tema_web',
    recursoFuenteId: '',
    extension: 'normal',
    instruccionesAdicionales: '',
    tipoRecursoId: '',
    publicado: true,
  };
}

export function PreparadorIa() {
  const esSuper = esSuperadministrador();
  const [catalogos, setCatalogos] =
    useState<CatalogosPreparadorIa>(catalogosVacios);
  const [formulario, setFormulario] = useState<FormularioPreparador>(
    crearFormularioInicial,
  );
  const [material, setMaterial] = useState<MaterialIaGenerado | null>(null);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [recursosRepositorio, setRecursosRepositorio] = useState<Recurso[]>([]);
  const [busquedaRecursoFuente, setBusquedaRecursoFuente] = useState('');
  const [cargandoRecursos, setCargandoRecursos] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [ultimoDocumento, setUltimoDocumento] = useState<{
    nombre: string;
    ruta: string;
  } | null>(null);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (formulario.origenContenido === 'recurso_repositorio') {
      cargarRecursosRepositorio();
    }
  }, [
    formulario.origenContenido,
    formulario.institucionId,
    formulario.gradoEscolarId,
    formulario.categoriaId,
  ]);

  async function cargarCatalogos() {
    try {
      setCargandoCatalogos(true);
      const data = await obtenerCatalogosPreparadorIa();
      const tipoPdf =
        data.tiposRecursos.find((tipo) =>
          `${tipo.nombre}`.toLowerCase().includes('pdf'),
        ) ||
        data.tiposRecursos.find((tipo) =>
          `${tipo.nombre}`.toLowerCase().includes('documento'),
        );

      setCatalogos(data);
      setFormulario((prev) => ({
        ...prev,
        gradoEscolarId:
          prev.gradoEscolarId || data.gradosEscolares[0]?.id?.toString() || '',
        tipoRecursoId: prev.tipoRecursoId || tipoPdf?.id?.toString() || '',
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los catálogos.',
      );
    } finally {
      setCargandoCatalogos(false);
    }
  }

  async function cargarRecursosRepositorio() {
    if (esSuper && !formulario.institucionId) {
      setRecursosRepositorio([]);
      return;
    }

    try {
      setCargandoRecursos(true);
      const respuesta = await obtenerRecursosRepositorio({
        limite: 100,
        institucionId: formulario.institucionId || undefined,
        gradoEscolarId: formulario.gradoEscolarId || undefined,
        categoriaId: formulario.categoriaId || undefined,
      });
      const recursosEvaluables = respuesta.data.filter((recurso) =>
        esRecursoEvaluable(recurso),
      );

      setRecursosRepositorio(recursosEvaluables);
      setFormulario((prev) => ({
        ...prev,
        recursoFuenteId: recursosEvaluables.some(
          (recurso) => String(recurso.id) === prev.recursoFuenteId,
        )
          ? prev.recursoFuenteId
          : '',
      }));
    } catch {
      setRecursosRepositorio([]);
      setError(
        'No se pudieron cargar los recursos evaluables del repositorio.',
      );
    } finally {
      setCargandoRecursos(false);
    }
  }

  const categoriasDisponibles = useMemo(() => {
    const institucionId = Number(formulario.institucionId);

    if (esSuper && institucionId) {
      return catalogos.categorias.filter(
        (categoria) => Number(categoria.institucionId) === institucionId,
      );
    }

    return catalogos.categorias;
  }, [catalogos.categorias, esSuper, formulario.institucionId]);

  const tiposMaterialDisponibles = useMemo(() => {
    if (formulario.origenContenido !== 'recurso_repositorio') {
      return tiposMaterial;
    }

    return tiposMaterial.filter((tipo) =>
      ['quiz', 'taller', 'evaluacion'].includes(tipo.valor),
    );
  }, [formulario.origenContenido]);

  const recursoFuenteSeleccionado = useMemo(
    () =>
      recursosRepositorio.find(
        (recurso) => String(recurso.id) === formulario.recursoFuenteId,
      ),
    [formulario.recursoFuenteId, recursosRepositorio],
  );

  const recursosRepositorioFiltrados = useMemo(() => {
    const termino = busquedaRecursoFuente.trim().toLowerCase();

    if (!termino) {
      return recursosRepositorio;
    }

    return recursosRepositorio.filter((recurso) => {
      const texto = [
        recurso.titulo,
        recurso.categoria?.nombre,
        recurso.gradoEscolar?.nombre,
        recurso.tipoRecurso?.nombre,
        extensionRecurso(recurso),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return texto.includes(termino);
    });
  }, [busquedaRecursoFuente, recursosRepositorio]);

  function manejarCambio(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;

    if (name === 'origenContenido') {
      const origen = value as OrigenMaterialIa;
      setFormulario((prev) => ({
        ...prev,
        origenContenido: origen,
        recursoFuenteId: '',
        tipoMaterial:
          origen === 'recurso_repositorio' &&
          !['quiz', 'taller', 'evaluacion'].includes(prev.tipoMaterial)
            ? 'evaluacion'
            : prev.tipoMaterial,
      }));
      if (origen === 'tema_web') {
        setBusquedaRecursoFuente('');
      }
      return;
    }

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'institucionId' ? { categoriaId: '' } : {}),
    }));
  }

  async function generar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (formulario.origenContenido === 'tema_web' && !formulario.tema.trim()) {
      setError('Indica el tema que quieres preparar.');
      return;
    }

    if (
      formulario.origenContenido === 'recurso_repositorio' &&
      !formulario.recursoFuenteId
    ) {
      setError('Selecciona el recurso del repositorio que quieres evaluar.');
      return;
    }

    if (esSuper && !formulario.institucionId) {
      setError('Selecciona la institución para preparar el material.');
      return;
    }

    try {
      setGenerando(true);
      setError('');
      setExito('');
      const temaBase =
        formulario.tema.trim() ||
        recursoFuenteSeleccionado?.titulo ||
        'Evaluación desde recurso del repositorio';
      const respuesta = await generarMaterialIa({
        tema: temaBase,
        gradoEscolarId: formulario.gradoEscolarId,
        institucionId: formulario.institucionId || undefined,
        categoriaId: formulario.categoriaId || undefined,
        tipoMaterial: formulario.tipoMaterial,
        extension: formulario.extension,
        instruccionesAdicionales:
          formulario.instruccionesAdicionales.trim() || undefined,
        origenContenido: formulario.origenContenido,
        recursoFuenteId:
          formulario.origenContenido === 'recurso_repositorio'
            ? formulario.recursoFuenteId
            : undefined,
      });

      setMaterial({
        ...respuesta,
        institucionId: formulario.institucionId,
        categoriaId: formulario.categoriaId || respuesta.categoriaId,
      } as MaterialIaGenerado);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo generar el material.',
      );
    } finally {
      setGenerando(false);
    }
  }

  async function guardar() {
    if (!material) {
      return;
    }

    if (esSuper && !formulario.institucionId) {
      setError('Selecciona la institución antes de guardar.');
      return;
    }

    try {
      setGuardando(true);
      setError('');
      const respuesta = await guardarMaterialIa({
        titulo: material.titulo,
        tema: material.tema,
        gradoEscolarId: formulario.gradoEscolarId || material.gradoEscolarId,
        institucionId: formulario.institucionId || undefined,
        categoriaId: formulario.categoriaId || material.categoriaId,
        tipoRecursoId: formulario.tipoRecursoId || undefined,
        tipoMaterial: material.tipoMaterial,
        extension: material.extension,
        introduccion: material.introduccion,
        objetivos: material.objetivos,
        conceptosClave: material.conceptosClave,
        secciones: material.secciones,
        actividadClase: material.actividadClase,
        preguntasComprension: material.preguntasComprension,
        cierre: material.cierre,
        palabrasClave: material.palabrasClave,
        fuentes: material.fuentes,
        publicado: formulario.publicado,
      });

      setExito(respuesta.mensaje);
      setUltimoDocumento({
        nombre: respuesta.archivo.nombreArchivo,
        ruta: respuesta.archivo.rutaPublica,
      });
      setMaterial(null);
      setFormulario((prev) => ({
        ...prev,
        tema: '',
        categoriaId: '',
        gradoEscolarId: '',
        instruccionesAdicionales: '',
        tipoMaterial: 'guia_clase',
        origenContenido: 'tema_web',
        recursoFuenteId: '',
        extension: 'normal',
        tipoRecursoId: '',
        publicado: true,
        ...(esSuper ? { institucionId: '' } : {}),
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar el material.',
      );
    } finally {
      setGuardando(false);
    }
  }

  function actualizarCampoMaterial<K extends keyof MaterialIaGenerado>(
    campo: K,
    valor: MaterialIaGenerado[K],
  ) {
    setMaterial((prev) => (prev ? { ...prev, [campo]: valor } : prev));
  }

  function actualizarLista(
    campo:
      | 'objetivos'
      | 'conceptosClave'
      | 'preguntasComprension'
      | 'palabrasClave',
    indice: number,
    valor: string,
  ) {
    setMaterial((prev) => {
      if (!prev) return prev;
      const lista = [...prev[campo]];
      lista[indice] = valor;
      return { ...prev, [campo]: lista };
    });
  }

  function agregarItem(
    campo:
      | 'objetivos'
      | 'conceptosClave'
      | 'preguntasComprension'
      | 'palabrasClave',
    texto: string,
  ) {
    setMaterial((prev) =>
      prev ? { ...prev, [campo]: [...prev[campo], texto] } : prev,
    );
  }

  function eliminarItem(
    campo:
      | 'objetivos'
      | 'conceptosClave'
      | 'preguntasComprension'
      | 'palabrasClave',
    indice: number,
  ) {
    setMaterial((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [campo]: prev[campo].filter((_, itemIndice) => itemIndice !== indice),
      };
    });
  }

  function actualizarSeccion(
    indice: number,
    campo: keyof SeccionMaterialIa,
    valor: string,
  ) {
    setMaterial((prev) => {
      if (!prev) return prev;
      const secciones = [...prev.secciones];
      secciones[indice] = { ...secciones[indice], [campo]: valor };
      return { ...prev, secciones };
    });
  }

  function agregarSeccion() {
    setMaterial((prev) =>
      prev
        ? {
            ...prev,
            secciones: [
              ...prev.secciones,
              { titulo: 'Nueva sección', contenido: '' },
            ],
          }
        : prev,
    );
  }

  function eliminarSeccion(indice: number) {
    setMaterial((prev) =>
      prev
        ? {
            ...prev,
            secciones: prev.secciones.filter((_, item) => item !== indice),
          }
        : prev,
    );
  }

  function renderListaEditable(
    titulo: string,
    campo:
      | 'objetivos'
      | 'conceptosClave'
      | 'preguntasComprension'
      | 'palabrasClave',
    placeholder: string,
  ) {
    if (!material) return null;

    return (
      <section className="ai-document-section">
        <div className="ai-section-head">
          <h3>{titulo}</h3>
          <button
            type="button"
            className="mini-button"
            onClick={() => agregarItem(campo, placeholder)}
          >
            Agregar
          </button>
        </div>
        <div className="ai-edit-list">
          {material[campo].map((item, indice) => (
            <div className="ai-edit-row-wrap" key={`${campo}-${indice}`}>
              <div className="ai-edit-row">
                <input
                  value={item}
                  onChange={(event) =>
                    actualizarLista(campo, indice, event.target.value)
                  }
                />
                <button
                  type="button"
                  className="mini-button danger"
                  onClick={() => eliminarItem(campo, indice)}
                  aria-label="Eliminar"
                >
                  ×
                </button>
              </div>
              <VistaMatematica texto={item} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="preparador-page">
      <header className="preparador-header">
        <div>
          <span className="section-label">Inteligencia académica</span>
          <h1>Preparador IA de clases</h1>
          <p>
            Crea material académico con fuentes web y guárdalo como recurso del
            repositorio.
          </p>
        </div>
      </header>

      <div className="preparador-layout">
        <form className="ai-chat-panel" onSubmit={generar}>
          <div className="ai-chat-message assistant">
            <strong>Preparador IA</strong>
            <p>Indica el origen, el grado y el formato del material.</p>
          </div>

          <label className="ai-field full">
            Origen del material
            <select
              name="origenContenido"
              value={formulario.origenContenido}
              onChange={manejarCambio}
            >
              <option value="tema_web">
                Preparar desde un tema con búsqueda web
              </option>
              <option value="recurso_repositorio">
                Preparar quiz o examen desde un recurso del repositorio
              </option>
            </select>
          </label>

          <label className="ai-field full">
            <span>
              {formulario.origenContenido === 'recurso_repositorio'
                ? 'Enfoque de la evaluación'
                : 'Tema o pregunta de clase'}
              <small>
                {formulario.tema.length}/{limiteTema}
              </small>
            </span>
            <textarea
              name="tema"
              value={formulario.tema}
              onChange={manejarCambio}
              rows={4}
              maxLength={limiteTema}
              placeholder={
                formulario.origenContenido === 'recurso_repositorio'
                  ? 'Ej: evaluar conceptos principales y casos de aplicación'
                  : 'Ej: fotosíntesis y su importancia en los ecosistemas'
              }
              required={formulario.origenContenido === 'tema_web'}
            />
          </label>

          <div className="ai-form-grid">
            {esSuper && (
              <label className="ai-field">
                Institución
                <select
                  name="institucionId"
                  value={formulario.institucionId}
                  onChange={manejarCambio}
                  required
                >
                  <option value="">Selecciona una institución</option>
                  {catalogos.instituciones.map((institucion) => (
                    <option key={institucion.id} value={institucion.id}>
                      {institucion.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="ai-field">
              Grado escolar
              <select
                name="gradoEscolarId"
                value={formulario.gradoEscolarId}
                onChange={manejarCambio}
                required
              >
                <option value="">Selecciona un grado</option>
                {catalogos.gradosEscolares.map((grado) => (
                  <option key={grado.id} value={grado.id}>
                    {grado.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="ai-field">
              Categoría
              <select
                name="categoriaId"
                value={formulario.categoriaId}
                onChange={manejarCambio}
              >
                <option value="">Clasificación automática</option>
                {categoriasDisponibles.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                    {esSuper && categoria.institucion
                      ? ` · ${categoria.institucion.nombre}`
                      : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="ai-field">
              Tipo de material
              <select
                name="tipoMaterial"
                value={formulario.tipoMaterial}
                onChange={manejarCambio}
              >
                {tiposMaterialDisponibles.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ai-field">
              Extensión
              <select
                name="extension"
                value={formulario.extension}
                onChange={manejarCambio}
              >
                {extensionesMaterial.map((extension) => (
                  <option key={extension.valor} value={extension.valor}>
                    {extension.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {formulario.origenContenido === 'recurso_repositorio' && (
            <section className="ai-resource-picker ai-field full">
              <div className="ai-section-head ai-resource-picker-head">
                <div>
                  <h3>Recurso base del repositorio</h3>
                  <p>
                    Busca por título, grado, categoría o formato y selecciona el
                    material que servirá como base de la evaluación.
                  </p>
                </div>
                <span>{recursosRepositorioFiltrados.length} recursos</span>
              </div>

              <input
                value={busquedaRecursoFuente}
                onChange={(event) => setBusquedaRecursoFuente(event.target.value)}
                placeholder="Buscar por título, grado, categoría o tipo"
                disabled={cargandoRecursos || (esSuper && !formulario.institucionId)}
              />

              {recursoFuenteSeleccionado && (
                <div className="ai-resource-selected">
                  <strong>{recursoFuenteSeleccionado.titulo}</strong>
                  <p>
                    {recursoFuenteSeleccionado.gradoEscolar?.nombre || 'Sin grado'} ·{' '}
                    {recursoFuenteSeleccionado.categoria?.nombre || 'Sin categoría'} ·{' '}
                    {extensionRecurso(recursoFuenteSeleccionado).toUpperCase() || 'ARCHIVO'}
                  </p>
                </div>
              )}

              {cargandoRecursos ? (
                <p className="state-message">Cargando recursos del repositorio...</p>
              ) : (
                <div className="table-responsive">
                  <table className="data-table ai-resource-table">
                    <thead>
                      <tr>
                        <th>Recurso</th>
                        <th>Grado</th>
                        <th>Categoría</th>
                        <th>Formato</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recursosRepositorioFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="empty-table">
                            No hay recursos que coincidan con la búsqueda.
                          </td>
                        </tr>
                      ) : (
                        recursosRepositorioFiltrados.map((recurso) => {
                          const seleccionado =
                            recursoFuenteSeleccionado?.id === recurso.id;

                          return (
                            <tr
                              key={recurso.id}
                              className={seleccionado ? 'selected-resource-row' : ''}
                            >
                              <td data-label="Recurso">
                                <strong>{recurso.titulo}</strong>
                                <small>
                                  {recurso.tipoRecurso?.nombre || 'Sin tipo'} ·{' '}
                                  {recurso.usuarioCreador
                                    ? `${recurso.usuarioCreador.nombres} ${recurso.usuarioCreador.apellidos}`
                                    : 'Repositorio institucional'}
                                </small>
                              </td>
                              <td data-label="Grado">
                                {recurso.gradoEscolar?.nombre || 'Sin grado'}
                              </td>
                              <td data-label="Categoría">
                                {recurso.categoria?.nombre || 'Sin categoría'}
                              </td>
                              <td data-label="Formato">
                                {extensionRecurso(recurso).toUpperCase() || 'ARCHIVO'}
                              </td>
                              <td data-label="Acción">
                                <button
                                  type="button"
                                  className="secondary-button ai-resource-select-button"
                                  onClick={() =>
                                    setFormulario((prev) => ({
                                      ...prev,
                                      recursoFuenteId: String(recurso.id),
                                    }))
                                  }
                                  disabled={seleccionado}
                                >
                                  {seleccionado ? 'Seleccionado' : 'Elegir'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          <label className="ai-field full">
            <span>
              Indicaciones adicionales
              <small>
                {formulario.instruccionesAdicionales.length}/
                {limiteInstrucciones}
              </small>
            </span>
            <textarea
              name="instruccionesAdicionales"
              value={formulario.instruccionesAdicionales}
              onChange={manejarCambio}
              rows={4}
              maxLength={limiteInstrucciones}
              placeholder="Ej: incluir ejemplos de Colombia y una actividad grupal"
            />
          </label>

          {error && <p className="ai-alert error">{error}</p>}
          {exito && (
            <p className="ai-alert success">
              {exito}{' '}
              {ultimoDocumento && (
                <a
                  href={`${API_URL}${ultimoDocumento.ruta}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir último PDF
                </a>
              )}
            </p>
          )}

          <div className="ai-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={generando || cargandoCatalogos}
            >
              {generando ? 'Generando material...' : 'Generar material'}
            </button>
          </div>
        </form>

        <article className="ai-preview-panel">
          {!material && (
            <div className="ai-empty-preview">
              <span>IA</span>
              <h2>Vista previa del material</h2>
              <p>
                Cuando generes el contenido, podrás revisarlo y ajustarlo antes
                de guardarlo.
              </p>
            </div>
          )}

          {material && (
            <>
              <div className="ai-preview-toolbar">
                <div>
                  <span className="section-label">Documento generado</span>
                  <h2>{material.titulo}</h2>
                </div>
                <div className="ai-save-controls">
                  <label>
                    Tipo recurso
                    <select
                      name="tipoRecursoId"
                      value={formulario.tipoRecursoId}
                      onChange={manejarCambio}
                    >
                      <option value="">Automático</option>
                      {catalogos.tiposRecursos.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="ai-check">
                    <input
                      type="checkbox"
                      checked={formulario.publicado}
                      onChange={(event) =>
                        setFormulario((prev) => ({
                          ...prev,
                          publicado: event.target.checked,
                        }))
                      }
                    />
                    Publicado
                  </label>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={guardar}
                    disabled={guardando}
                  >
                    {guardando ? 'Guardando...' : 'Guardar PDF'}
                  </button>
                </div>
              </div>

              <CalificacionIa
                key={material.generadoEn}
                titulo="¿Cómo calificas la generación de este material con AI?"
                descripcion="Valora si la clase, taller o evaluación quedó útil para el objetivo académico."
                modulo="preparador_ia"
                funcionalidad="generacion_material"
                entidadTipo="material_preparador_ia"
                metadata={{
                  titulo: material.titulo,
                  tema: material.tema,
                  tipoMaterial: material.tipoMaterial,
                  extension: material.extension,
                  modelo: material.modelo,
                  generadoEn: material.generadoEn,
                  origenContenido: formulario.origenContenido,
                  recursoFuenteId: formulario.recursoFuenteId || null,
                  fuentes: material.fuentes.length,
                }}
              />

              <div className="ai-document">
                <label className="ai-document-title">
                  Título
                  <input
                    value={material.titulo}
                    onChange={(event) =>
                      actualizarCampoMaterial('titulo', event.target.value)
                    }
                  />
                </label>

                <div className="ai-document-meta">
                  <span>{material.gradoEscolar}</span>
                  <span>
                    {
                      tiposMaterial.find(
                        (tipo) => tipo.valor === material.tipoMaterial,
                      )?.label
                    }
                  </span>
                  <span>{textoUsuario() || 'Usuario del sistema'}</span>
                </div>

                <section className="ai-document-section">
                  <h3>Introducción</h3>
                  <textarea
                    value={material.introduccion}
                    onChange={(event) =>
                      actualizarCampoMaterial(
                        'introduccion',
                        event.target.value,
                      )
                    }
                    rows={5}
                  />
                  <VistaMatematica texto={material.introduccion} />
                </section>

                {renderListaEditable(
                  'Objetivos de aprendizaje',
                  'objetivos',
                  'Nuevo objetivo',
                )}
                {renderListaEditable(
                  'Conceptos clave',
                  'conceptosClave',
                  'Nuevo concepto',
                )}

                <section className="ai-document-section">
                  <div className="ai-section-head">
                    <h3>Desarrollo</h3>
                    <button
                      type="button"
                      className="mini-button"
                      onClick={agregarSeccion}
                    >
                      Agregar sección
                    </button>
                  </div>
                  <div className="ai-sections-list">
                    {material.secciones.map((seccion, indice) => (
                      <div className="ai-generated-section" key={indice}>
                        <input
                          value={seccion.titulo}
                          onChange={(event) =>
                            actualizarSeccion(
                              indice,
                              'titulo',
                              event.target.value,
                            )
                          }
                        />
                        <textarea
                          value={seccion.contenido}
                          onChange={(event) =>
                            actualizarSeccion(
                              indice,
                              'contenido',
                              event.target.value,
                            )
                          }
                          rows={7}
                        />
                        <VistaMatematica texto={seccion.contenido} />
                        <button
                          type="button"
                          className="mini-button danger"
                          onClick={() => eliminarSeccion(indice)}
                        >
                          Eliminar sección
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="ai-document-section">
                  <h3>Actividad para clase</h3>
                  <textarea
                    value={material.actividadClase}
                    onChange={(event) =>
                      actualizarCampoMaterial(
                        'actividadClase',
                        event.target.value,
                      )
                    }
                    rows={5}
                  />
                  <VistaMatematica texto={material.actividadClase} />
                </section>

                {renderListaEditable(
                  'Preguntas de comprensión',
                  'preguntasComprension',
                  'Nueva pregunta',
                )}

                <section className="ai-document-section">
                  <h3>Cierre sugerido</h3>
                  <textarea
                    value={material.cierre}
                    onChange={(event) =>
                      actualizarCampoMaterial('cierre', event.target.value)
                    }
                    rows={4}
                  />
                  <VistaMatematica texto={material.cierre} />
                </section>

                {renderListaEditable(
                  'Palabras clave',
                  'palabrasClave',
                  'Nueva palabra clave',
                )}

                {material.fuentes.length > 0 && (
                  <section className="ai-document-section">
                    <h3>Fuentes consultadas</h3>
                    <div className="ai-sources">
                      {material.fuentes.map((fuente) => (
                        <a
                          key={fuente.url}
                          href={fuente.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {fuente.titulo}
                        </a>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
