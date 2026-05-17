import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';
import {
  PERMISOS,
  tieneAccesoTotal,
  tienePermiso,
  validarPermiso,
} from '../../auth/utils/roles.util';
import { ConsultaAsistenteDto } from '../dto/consulta-asistente.dto';

const palabrasVacias = new Set([
  'a',
  'al',
  'como',
  'con',
  'de',
  'del',
  'donde',
  'el',
  'en',
  'encuentro',
  'encontrar',
  'hacer',
  'indicame',
  'indícame',
  'la',
  'las',
  'le',
  'lo',
  'los',
  'me',
  'para',
  'por',
  'puedo',
  'que',
  'recurso',
  'recursos',
  'sobre',
  'un',
  'una',
]);

@Injectable()
export class AsistenteService {
  constructor(private readonly prisma: PrismaService) {}

  private limpiarTexto(valor: string) {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extraerTerminos(pregunta: string) {
    const texto = this.limpiarTexto(pregunta);

    return texto
      .split(' ')
      .map((termino) => termino.trim())
      .filter((termino) => termino.length >= 3)
      .filter((termino) => !palabrasVacias.has(termino))
      .slice(0, 8);
  }

  private construirFiltroBase(usuarioAuth: any): Prisma.RecursoWhereInput {
    const where: Prisma.RecursoWhereInput = {
      estado: true,
      publicado: true,
      ...(tieneAccesoTotal(usuarioAuth)
        ? {}
        : { institucionId: Number(usuarioAuth?.institucionId) }),
    };

    if (!tienePermiso(usuarioAuth, PERMISOS.RECURSOS_VER_TODOS_GRADOS)) {
      where.gradoEscolarId = Number(usuarioAuth?.gradoEscolarId || -1);
    }

    return where;
  }

  async consultar(data: ConsultaAsistenteDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_VER);

    const terminos = this.extraerTerminos(data.pregunta);
    const busqueda = terminos.join(' ');
    const whereBase = this.construirFiltroBase(usuarioAuth);

    if (terminos.length === 0) {
      return {
        mensaje:
          'Puedo ayudarte a encontrar recursos. Intenta preguntarme por un tema, por ejemplo: fracciones, lectura crítica o ecuaciones.',
        busquedaSugerida: '',
        recursos: [],
      };
    }

    const condicionesBusqueda: Prisma.RecursoWhereInput[] = terminos.flatMap(
      (termino) => [
        { titulo: { contains: termino, mode: 'insensitive' } },
        { palabrasClave: { contains: termino, mode: 'insensitive' } },
        { contenidoResumen: { contains: termino, mode: 'insensitive' } },
        { autorNombre: { contains: termino, mode: 'insensitive' } },
        { fuente: { contains: termino, mode: 'insensitive' } },
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
      ],
    );

    const recursos = await this.prisma.recurso.findMany({
      where: {
        AND: [
          whereBase,
          {
            OR: condicionesBusqueda,
          },
        ],
      },
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
      },
      orderBy: {
        id: 'desc',
      },
      take: 5,
    });

    if (recursos.length === 0) {
      return {
        mensaje:
          'No encontré recursos publicados relacionados con esa consulta dentro de tu alcance. Puedes intentar con otras palabras clave o revisar el repositorio.',
        busquedaSugerida: busqueda,
        recursos: [],
      };
    }

    return {
      mensaje: `Encontré ${recursos.length} recurso${recursos.length === 1 ? '' : 's'} relacionado${recursos.length === 1 ? '' : 's'} con tu consulta.`,
      busquedaSugerida: busqueda,
      recursos: recursos.map((recurso) => ({
        id: recurso.id,
        titulo: recurso.titulo,
        resumen: recurso.contenidoResumen,
        palabrasClave: recurso.palabrasClave,
        categoria: recurso.categoria?.nombre,
        tipoRecurso: recurso.tipoRecurso?.nombre,
        gradoEscolar: recurso.gradoEscolar?.nombre,
        rutaRepositorio: `/repositorio/recursos?recursoId=${recurso.id}&busqueda=${encodeURIComponent(
          recurso.titulo,
        )}`,
      })),
    };
  }
}
