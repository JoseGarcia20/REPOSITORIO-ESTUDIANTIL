import {IsString, IsEmail, IsNotEmpty, IsDateString, IsInt, MinLength, IsOptional,} from 'class-validator';

export class CrearUsuarioDto {

  @IsString()
  @IsNotEmpty()
  nombres!: string;

  @IsString()
  @IsNotEmpty()
  apellidos!: string;

  @IsEmail()
  correo!: string;

  @IsString()
  @IsNotEmpty()
  tipoDocumento!: string;

  @IsString()
  @IsNotEmpty()
  documento!: string;

  @IsDateString()
  fechaNacimiento!: string;

  @IsString()
  @IsNotEmpty()
  genero!: string;

  @IsString()
  @MinLength(6)
  contrasena!: string;

  @IsInt()
  institucionId!: number;

  @IsInt()
  rolId!: number;

  @IsOptional()
  @IsInt()
  gradoEscolarId?: number;

}
