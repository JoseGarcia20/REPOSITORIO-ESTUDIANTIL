import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearTiposRecursosDto {
  
  @IsString()
  @IsNotEmpty()
  nombre!: string;

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
