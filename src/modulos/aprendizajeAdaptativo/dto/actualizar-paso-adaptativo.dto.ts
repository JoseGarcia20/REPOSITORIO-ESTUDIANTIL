import { IsBoolean } from 'class-validator';

export class ActualizarPasoAdaptativoDto {
  @IsBoolean()
  completado: boolean;
}
