import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearTiposAprendizajeDto {
  
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
  
  @IsOptional()
  @IsBoolean()
  estado?: string;
  
}