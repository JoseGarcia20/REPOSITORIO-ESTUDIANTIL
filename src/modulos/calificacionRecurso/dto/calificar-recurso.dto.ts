import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CalificarRecursoDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  calificacion!: number;

  @IsOptional()
  @IsString()
  comentario?: string;
}
