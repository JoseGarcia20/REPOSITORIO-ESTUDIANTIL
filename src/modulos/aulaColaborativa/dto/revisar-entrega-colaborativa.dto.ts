import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class RevisarEntregaColaborativaDto {
  @IsIn(['aprobada', 'requiere_ajustes', 'rechazada'])
  estado!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  calificacion?: number;

  @IsOptional()
  @IsString()
  comentariosDocente?: string;
}
