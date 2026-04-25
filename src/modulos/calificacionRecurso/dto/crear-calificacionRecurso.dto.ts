import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CrearCalificacionRecursoDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  calificacion!: number;

  @IsOptional()
  @IsString()
  comentario?: string;

  @IsInt()
  usuarioId!: number;

  @IsInt()
  recursoId!: number;
}