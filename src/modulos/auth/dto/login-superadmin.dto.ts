import { IsNotEmpty, IsString } from 'class-validator';

export class LoginSuperadminDto {
  @IsString()
  @IsNotEmpty()
  usuario!: string;

  @IsString()
  @IsNotEmpty()
  contrasena!: string;
}
