import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import {
  PERMISOS,
  tieneAccesoTotal,
  tienePermiso,
  validarPermiso,
} from '../../auth/utils/roles.util';
import { ConsultaRecomendacionRecursosDto } from '../dto/consulta-recomendacion-recursos.dto';

const palabrasVacias = new Set([
  'academico',
  'academica',
  'actividad',
  'actividades',
  'archivo',
  'clase',
  'como',
  'con',
  'contenido',
  'del',
  'donde',
  'educativo',
  'educativa',
  'el',
  'en',
  'encuentro',
  'encontrar',
  'estudiante',
  'estudiantes',
  'hacer',
  'indicame',
  'indícame',
  'la',
  'las',
  'le',
  'lo',
  'los',
  'material',
  'me',
  'para',
  'por',
  'puedo',
  'que',
  'recurso',
  'recursos',
  'sobre',
  'tema',
  'trabajo',
  'un',
  'una',
]);

type RecursoCandidato = Prisma.RecursoGetPayload<{
  include: {
    categoria: { select: { id: true; nombre: true } };
    tipoRecurso: { select: { id: true; nombre: true } };
    gradoEscolar: { select: { id: true; nombre: true } };
    calificaciones: { select: { calificacion: true } };
  };
}>;

@Injectable()
export class RecomendacionesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizarTexto(valor?: string | null) {
    return (valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extraerTerminos(texto: string) {
    return Array.from(new Set(this.normalizarTexto(texto).split(' ')))
      .map((termino) => termino.trim())
      .filter((termino) => termino.length >= 3)
      .filter((termino) => !palabrasVacias.has(termino))
      .slice(0, 10);
  }

  private numeroPositivo(valor?: string | number | null) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : null;
  }

  private numerosPositivos(valor?: string | number | null) {
    return Array.from(
      new Set(
        String(valor || '')
          .split(',')
          .map((item) => this.numeroPositivo(item.trim()))
          .filter((item): item is number => Boolean(item)),
      ),
    );
  }

  private obtenerCategoriaIds(query: ConsultaRecomendacionRecursosDto) {
    const categoriaIds = this.numerosPositivos(query.categoriaIds);
    const categoriaId = this.numeroPositivo(query.categoriaId);

    if (categoriaId) {
      categoriaIds.push(categoriaId);
    }

    return Array.from(new Set(categoriaIds));
  }

  private construirFiltroBase(
    usuarioAuth: any,
    query: ConsultaRecomendacionRecursosDto,
    terminos: string[],
  ): Prisma.RecursoWhereInput {
    const where: Prisma.RecursoWhereInput = {
      estado: true,
      publicado: true,
      ...(tieneAccesoTotal(usuarioAuth)
        ? {}
        : { institucionId: Number(usuarioAuth?.institucionId) }),
    };

    const puedeVerTodosLosGrados = tienePermiso(
      usuarioAuth,
      PERMISOS.RECURSOS_VER_TODOS_GRADOS,
    );

    if (!puedeVerTodosLosGrados) {
      where.gradoEscolarId = Number(usuarioAuth?.gradoEscolarId || -1);
    } else if (query.gradoEscolarId) {
      where.gradoEscolarId = Number(query.gradoEscolarId);
    }

    const categoriaIds = this.obtenerCategoriaIds(query);

    if (categoriaIds.length > 0) {
      where.categoriaId = {
        in: categoriaIds,
      };
    }

    if (query.tipoRecursoId) {
      where.tipoRecursoId = Number(query.tipoRecursoId);
    }

    if (query.excluirRecursoId) {
      where.id = {
        not: Number(query.excluirRecursoId),
      };
    }

    if (terminos.length > 0) {
      where.OR = terminos.flatMap((termino) => [
        { titulo: { contains: termino, mode: 'insensitive' } },
        { palabrasClave: { contains: termino, mode: 'insensitive' } },
        { contenidoResumen: { contains: termino, mode: 'insensitive' } },
        { fuente: { contains: termino, mode: 'insensitive' } },
        { autorNombre: { contains: termino, mode: 'insensitive' } },
        { nivelAcademico: { contains: termino, mode: 'insensitive' } },
        {
          categoria: {
            nombre: { contains: termino, mode: 'insensitive' },
          },
        },
        {
          tipoRecurso: {
            nombre: { contains: termino, mode: 'insensitive' },
          },
        },
        {
          gradoEscolar: {
            nombre: { contains: termino, mode: 'insensitive' },
          },
        },
      ]);
    }

    return where;
  }

  private calcularPromedio(recurso: RecursoCandidato) {
    if (recurso.calificaciones.length === 0) {
      return {
        promedio: 0,
        total: 0,
      };
    }

    const total = recurso.calificaciones.length;
    const suma = recurso.calificaciones.reduce(
      (acumulado, item) => acumulado + item.calificacion,
      0,
    );

    return {
      promedio: suma / total,
      total,
    };
  }

  private sumarPorCoincidencia(
    texto: string,
    terminos: string[],
    peso: number,
  ) {
    return terminos.reduce(
      (total, termino) => (texto.includes(termino) ? total + peso : total),
      0,
    );
  }

  private puntuarRecurso(
    recurso: RecursoCandidato,
    query: ConsultaRecomendacionRecursosDto,
    terminos: string[],
  ) {
    const tema = this.normalizarTexto(query.tema);
    const titulo = this.normalizarTexto(recurso.titulo);
    const palabrasClave = this.normalizarTexto(recurso.palabrasClave);
    const resumen = this.normalizarTexto(recurso.contenidoResumen);
    const categoria = this.normalizarTexto(recurso.categoria?.nombre);
    const tipo = this.normalizarTexto(recurso.tipoRecurso?.nombre);
    const grado = this.normalizarTexto(recurso.gradoEscolar?.nombre);
    const fuente = this.normalizarTexto(recurso.fuente);
    const autor = this.normalizarTexto(recurso.autorNombre);
    const calificacion = this.calcularPromedio(recurso);
    const motivos = new Set<string>();
    let puntaje = 0;

    if (tema && titulo.includes(tema)) {
      puntaje += 12;
      motivos.add('Coincide directamente con el tema');
    }

    const puntosTitulo = this.sumarPorCoincidencia(titulo, terminos, 8);
    const puntosClave = this.sumarPorCoincidencia(palabrasClave, terminos, 7);
    const puntosResumen = this.sumarPorCoincidencia(resumen, terminos, 4);
    const puntosCategoria = this.sumarPorCoincidencia(categoria, terminos, 5);
    const puntosTipo = this.sumarPorCoincidencia(tipo, terminos, 3);
    const puntosGrado = this.sumarPorCoincidencia(grado, terminos, 4);
    const puntosFuenteAutor =
      this.sumarPorCoincidencia(fuente, terminos, 2) +
      this.sumarPorCoincidencia(autor, terminos, 2);

    puntaje +=
      puntosTitulo +
      puntosClave +
      puntosResumen +
      puntosCategoria +
      puntosTipo +
      puntosGrado +
      puntosFuenteAutor;

    if (puntosTitulo > 0) motivos.add('Título relacionado');
    if (puntosClave > 0) motivos.add('Palabras clave relacionadas');
    if (puntosResumen > 0) motivos.add('Resumen relacionado');
    if (puntosCategoria > 0) motivos.add('Categoría cercana al tema');
    if (puntosGrado > 0) motivos.add('Grado escolar relacionado');

    if (this.obtenerCategoriaIds(query).includes(recurso.categoriaId)) {
      puntaje += 6;
      motivos.add('Misma categoría');
    }

    if (
      query.gradoEscolarId &&
      Number(query.gradoEscolarId) === recurso.gradoEscolarId
    ) {
      puntaje += 6;
      motivos.add('Mismo grado escolar');
    }

    if (calificacion.total > 0) {
      puntaje +=
        calificacion.promedio * 2 + Math.min(calificacion.total, 10) * 0.4;
      motivos.add('Valorado por usuarios');
    }

    if (terminos.length === 0) {
      puntaje += calificacion.promedio * 2;
      motivos.add('Disponible en tu alcance académico');
    }

    return {
      puntaje,
      motivos: Array.from(motivos).slice(0, 3),
      promedioCalificacion: Number(calificacion.promedio.toFixed(2)),
      totalCalificaciones: calificacion.total,
    };
  }

  async recomendarRecursos(
    query: ConsultaRecomendacionRecursosDto = {},
    usuarioAuth: any,
  ) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_VER);

    const limite = Math.min(this.numeroPositivo(query.limite) || 5, 12);
    const terminos = this.extraerTerminos(query.tema || '');
    const where = this.construirFiltroBase(usuarioAuth, query, terminos);
    let candidatos = await this.prisma.recurso.findMany({
      where,
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
        tipoRecurso: {
          select: {
            id: true,
            nombre: true,
          },
        },
        gradoEscolar: {
          select: {
            id: true,
            nombre: true,
          },
        },
        calificaciones: {
          where: {
            estado: true,
          },
          select: {
            calificacion: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
      take: 80,
    });

    if (candidatos.length === 0 && terminos.length > 0) {
      candidatos = await this.prisma.recurso.findMany({
        where: this.construirFiltroBase(usuarioAuth, query, []),
        include: {
          categoria: {
            select: {
              id: true,
              nombre: true,
            },
          },
          tipoRecurso: {
            select: {
              id: true,
              nombre: true,
            },
          },
          gradoEscolar: {
            select: {
              id: true,
              nombre: true,
            },
          },
          calificaciones: {
            where: {
              estado: true,
            },
            select: {
              calificacion: true,
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
        take: 40,
      });
    }

    const recursos = candidatos
      .map((recurso) => {
        const puntaje = this.puntuarRecurso(recurso, query, terminos);

        return {
          recurso,
          ...puntaje,
        };
      })
      .sort(
        (a, b) =>
          b.puntaje - a.puntaje ||
          b.totalCalificaciones - a.totalCalificaciones ||
          b.recurso.id - a.recurso.id,
      )
      .slice(0, limite)
      .map(
        ({
          recurso,
          puntaje,
          motivos,
          promedioCalificacion,
          totalCalificaciones,
        }) => ({
          id: recurso.id,
          titulo: recurso.titulo,
          resumen: recurso.contenidoResumen,
          palabrasClave: recurso.palabrasClave,
          categoria: recurso.categoria?.nombre,
          tipoRecurso: recurso.tipoRecurso?.nombre,
          gradoEscolar: recurso.gradoEscolar?.nombre,
          puntaje: Number(puntaje.toFixed(2)),
          motivos:
            motivos.length > 0 ? motivos : ['Recurso disponible en tu alcance'],
          promedioCalificacion,
          totalCalificaciones,
          rutaRepositorio: `/repositorio/recursos?recursoId=${recurso.id}`,
        }),
      );

    return {
      tema: query.tema || '',
      terminos,
      recursos,
    };
  }
}
