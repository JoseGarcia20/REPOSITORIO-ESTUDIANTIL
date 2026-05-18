import { IsOptional, IsString } from 'class-validator';

export class CrearEntregaColaborativaDto {
  @IsOptional()
  @IsString()
  comentario?: string;
}
