import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class ActualizarRecursoDto {
  @IsOptional()
  @IsString()
  titulo?: string;

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
  @IsInt()
  gradoEscolarId?: number;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;

  @IsOptional()
  @IsInt()
  institucionId?: number;

  @IsOptional()
  @IsInt()
  categoriaId?: number;

  @IsOptional()
  @IsInt()
  tipoRecursoId?: number;

  @IsOptional()
  @IsInt()
  usuarioCreadorId?: number;
}
