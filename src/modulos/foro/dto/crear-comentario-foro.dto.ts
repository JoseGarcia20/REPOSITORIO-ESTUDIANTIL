import { IsNotEmpty, IsString } from 'class-validator';

export class CrearComentarioForoDto {
  @IsString()
  @IsNotEmpty()
  contenido!: string;
}
