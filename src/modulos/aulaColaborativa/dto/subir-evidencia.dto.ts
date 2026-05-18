import { IsOptional, IsString } from 'class-validator';

export class SubirEvidenciaDto {
  @IsOptional()
  @IsString()
  comentario?: string;
}
