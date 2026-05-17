import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ComentarRecursoForoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1200)
  contenido!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  titulo?: string;

  @IsOptional()
  gradoEscolarId?: string | number;
}
