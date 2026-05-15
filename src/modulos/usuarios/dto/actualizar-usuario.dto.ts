import { IsOptional, IsString, IsEmail, IsBoolean, IsDateString, IsInt } from 'class-validator';

export class ActualizarUsuarioDto {

  @IsOptional()
  @IsString()
  nombres?: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  genero?: string;

  @IsOptional()
  @IsString()
  foto?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsInt()
  institucionId?: number;

  @IsOptional()
  @IsInt()
  rolId?: number;

  @IsOptional()
  @IsInt()
  gradoEscolarId?: number;

}
