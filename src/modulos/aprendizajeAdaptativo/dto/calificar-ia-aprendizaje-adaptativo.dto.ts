import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CalificarIaAprendizajeAdaptativoDto {
  @IsInt()
  @Min(1)
  @Max(5)
  calificacion: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
