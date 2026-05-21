import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConsultaRecomendacionRecursosDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tema?: string;

  @IsOptional()
  @IsString()
  limite?: string;

  @IsOptional()
  @IsString()
  categoriaId?: string;

  @IsOptional()
  @IsString()
  categoriaIds?: string;

  @IsOptional()
  @IsString()
  tipoRecursoId?: string;

  @IsOptional()
  @IsString()
  gradoEscolarId?: string;

  @IsOptional()
  @IsString()
  excluirRecursoId?: string;
}
