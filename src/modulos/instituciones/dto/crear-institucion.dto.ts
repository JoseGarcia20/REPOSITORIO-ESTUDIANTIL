import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearInstitucionDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  codigo!: string;

  @IsString()
  @IsNotEmpty()
  nit!: string;

  @IsEmail()
  correo!: string;

  @IsString()
  telefono!: string;

  @IsString()
  direccion!: string;

  @IsString()
  ciudad!: string;

  @IsString()
  departamento!: string;

  @IsOptional()
  @IsString()
  sitioWeb?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
  
}