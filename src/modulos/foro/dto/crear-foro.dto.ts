import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearForoDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsOptional()
  @IsBoolean()
  publico?: boolean;

  @IsOptional()
  @IsInt()
  institucionId?: number;

  @IsInt()
  categoriaId!: number;
}
