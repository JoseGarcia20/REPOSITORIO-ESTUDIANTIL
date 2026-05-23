import { IsBoolean, IsOptional } from 'class-validator';

export class GenerarResumenIaRecursoDto {
  @IsOptional()
  @IsBoolean()
  forzar?: boolean;
}
