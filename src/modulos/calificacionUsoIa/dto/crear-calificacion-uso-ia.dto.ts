import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearCalificacionUsoIaDto {
  @IsString()
  @MaxLength(80)
  modulo!: string;

  @IsString()
  @MaxLength(100)
  funcionalidad!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entidadTipo?: string;

  @IsOptional()
  @IsInt()
  entidadId?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  calificacion!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
