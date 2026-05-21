import { Injectable } from '@nestjs/common';
import { PERMISOS, validarPermiso } from '../../auth/utils/roles.util';
import { RecomendacionesService } from '../../recomendaciones/servicios/recomendaciones.service';
import { ConsultaAsistenteDto } from '../dto/consulta-asistente.dto';

@Injectable()
export class AsistenteService {
  constructor(
    private readonly recomendacionesService: RecomendacionesService,
  ) {}

  async consultar(data: ConsultaAsistenteDto, usuarioAuth: any) {
    validarPermiso(usuarioAuth, PERMISOS.RECURSOS_VER);

    const terminos = this.recomendacionesService.extraerTerminos(data.pregunta);

    if (terminos.length === 0) {
      return {
        mensaje:
          'Puedo ayudarte a encontrar recursos. Intenta preguntarme por un tema, por ejemplo: fracciones, lectura crítica o ecuaciones.',
        busquedaSugerida: '',
        recursos: [],
      };
    }

    const recomendaciones =
      await this.recomendacionesService.recomendarRecursos(
        {
          tema: data.pregunta,
          limite: '5',
        },
        usuarioAuth,
      );

    if (recomendaciones.recursos.length === 0) {
      return {
        mensaje:
          'No encontré recursos publicados relacionados con esa consulta dentro de tu alcance. Puedes intentar con otras palabras clave o revisar el repositorio.',
        busquedaSugerida: terminos.join(' '),
        recursos: [],
      };
    }

    return {
      mensaje: `Encontré ${recomendaciones.recursos.length} recurso${
        recomendaciones.recursos.length === 1 ? '' : 's'
      } recomendado${
        recomendaciones.recursos.length === 1 ? '' : 's'
      } para tu consulta.`,
      busquedaSugerida: terminos.join(' '),
      recursos: recomendaciones.recursos,
    };
  }
}
