import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class ComentarRecursoExistenteForoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1200)
  contenido!: string;

  @IsInt()
  @Min(1)
  recursoId!: number;
}
