import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class ActualizarRutaAprendizajeDto {

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  temaObjetivo?: string;

  @IsOptional()
  @IsString()
  nivelDificultad?: string;

  @IsOptional()
  @IsString()
  duracionEstimada?: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;

  @IsOptional()
  @IsInt()
  tipoAprendizajeId?: number;

}