import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ActualizarRespuestaForoDto {

  @IsOptional()
  @IsString()
  contenido?: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;

}