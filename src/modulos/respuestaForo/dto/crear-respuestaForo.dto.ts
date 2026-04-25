import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CrearRespuestaForoDto {

  @IsString()
  @IsNotEmpty()
  contenido!: string;

  @IsInt()
  foroId!: number;

  @IsInt()
  usuarioId!: number;

}