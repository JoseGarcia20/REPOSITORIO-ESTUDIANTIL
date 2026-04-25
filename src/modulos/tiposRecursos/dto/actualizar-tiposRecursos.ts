import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ActualizarTiposRecursosDto {
  
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
  
  @IsOptional()
  @IsString()
  icono?: string;
  
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
  
}