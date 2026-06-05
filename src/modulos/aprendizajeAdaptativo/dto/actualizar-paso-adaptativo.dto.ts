import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class ActualizarPasoAdaptativoDto {
  @IsBoolean()
  completado: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  pasoActual?: number;
}
