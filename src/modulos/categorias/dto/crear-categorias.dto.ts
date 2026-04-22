import {IsString, IsNotEmpty, IsInt, IsBoolean} from 'class-validator';

export class CrearCategoriasDto {

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsString()
  @IsNotEmpty()
  color!: string;

  @IsBoolean()
  estado!: boolean;

  @IsInt()
  institucionId!: number;

}