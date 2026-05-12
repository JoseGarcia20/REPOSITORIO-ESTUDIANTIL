import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearRolesDto {
  
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
  
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
  
}
