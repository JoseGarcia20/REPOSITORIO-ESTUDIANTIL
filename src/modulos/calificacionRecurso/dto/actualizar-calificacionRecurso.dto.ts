import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ActualizarCalificacionRecursoDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  calificacion?: number;

  @IsOptional()
  @IsString()
  comentario?: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}