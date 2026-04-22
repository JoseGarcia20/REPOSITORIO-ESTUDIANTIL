import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ActualizarTiposAprendizajeDto {
  
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
  
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
  
}