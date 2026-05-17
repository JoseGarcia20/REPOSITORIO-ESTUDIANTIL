import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubirRecursoForoDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  titulo?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1200)
  contexto!: string;

  @IsOptional()
  gradoEscolarId?: string | number;

  @IsOptional()
  publicado?: string | boolean;
}
