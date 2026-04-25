import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CrearRutaAprendizajeDto {

  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsString()
  @IsNotEmpty()
  temaObjetivo!: string;

  @IsString()
  @IsNotEmpty()
  nivelDificultad!: string;

  @IsString()
  @IsNotEmpty()
  duracionEstimada!: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;

  @IsInt()
  tipoAprendizajeId!: number;

}