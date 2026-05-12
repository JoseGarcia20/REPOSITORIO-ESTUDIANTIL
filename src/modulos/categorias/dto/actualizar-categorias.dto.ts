import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class ActualizarCategoriasDto {

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  institucionId?: number;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;

}
