import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CrearRecursoDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsOptional()
  @IsString()
  palabrasClave?: string;

  @IsOptional()
  @IsString()
  contenidoResumen?: string;

  @IsOptional()
  @IsString()
  rutaRecurso?: string;

  @IsOptional()
  @IsString()
  urlRecurso?: string;

  @IsOptional()
  @IsString()
  fuente?: string;

  @IsOptional()
  @IsString()
  autorNombre?: string;

  @IsOptional()
  @IsString()
  nivelAcademico?: string;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;

  @IsInt()
  institucionId!: number;

  @IsInt()
  categoriaId!: number;

  @IsInt()
  tipoRecursoId!: number;

  @IsInt()
  usuarioCreadorId!: number;
}