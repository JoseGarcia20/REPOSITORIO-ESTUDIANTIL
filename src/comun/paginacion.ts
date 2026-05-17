export type ConsultaPaginada = {
  pagina?: string;
  limite?: string;
  busqueda?: string;
  estado?: string;
  institucionId?: string;
  rolId?: string;
  categoriaId?: string;
  tipoRecursoId?: string;
  tipoArchivo?: string;
  gradoEscolarId?: string;
  recursoId?: string;
  publicado?: string;
  publico?: string;
  cerrado?: string;
};

export type DatosPaginacion = {
  pagina: number;
  limite: number;
  skip: number;
  busqueda?: string;
};

export function obtenerPaginacion(
  query: ConsultaPaginada = {},
): DatosPaginacion {
  const pagina = Math.max(Number(query.pagina) || 1, 1);
  const limiteSolicitado = Math.max(Number(query.limite) || 10, 1);
  const limite = Math.min(limiteSolicitado, 100);

  return {
    pagina,
    limite,
    skip: (pagina - 1) * limite,
    busqueda: query.busqueda?.trim() || undefined,
  };
}

export function respuestaPaginada<T>(
  data: T[],
  total: number,
  pagina: number,
  limite: number,
) {
  return {
    data,
    total,
    pagina,
    limite,
    totalPaginas: Math.max(Math.ceil(total / limite), 1),
  };
}

export function valorBooleano(valor?: string) {
  if (valor === undefined || valor === '' || valor === 'todos') {
    return undefined;
  }

  if (valor === 'true' || valor === 'activo' || valor === 'publicado') {
    return true;
  }

  if (valor === 'false' || valor === 'inactivo' || valor === 'borrador') {
    return false;
  }

  return undefined;
}
