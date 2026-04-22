import { IsOptional, IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class ActualizarCategoriasDto {

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  @IsNotEmpty()
  color?: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;

}