import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CrearForoDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsInt()
  institucionId!: number;

  @IsInt()
  categoriaId!: number;

  @IsInt()
  usuarioId!: number;
}