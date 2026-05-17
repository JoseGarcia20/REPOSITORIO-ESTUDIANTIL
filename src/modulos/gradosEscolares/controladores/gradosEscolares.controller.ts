import { Controller, Get } from '@nestjs/common';
import { RequierePermisos } from '../../auth/decoradores/requiere-permisos.decorator';
import { PERMISOS } from '../../auth/utils/roles.util';
import { GradosEscolaresService } from '../servicios/gradosEscolares.service';

@Controller('grados-escolares')
export class GradosEscolaresController {
  constructor(
    private readonly gradosEscolaresService: GradosEscolaresService,
  ) {}

  @Get()
  @RequierePermisos(
    PERMISOS.USUARIOS_VER,
    PERMISOS.RECURSOS_VER,
    PERMISOS.RECURSOS_CREAR,
    PERMISOS.FOROS_SUBIR_RECURSO,
  )
  async listar() {
    return await this.gradosEscolaresService.listar();
  }
}
