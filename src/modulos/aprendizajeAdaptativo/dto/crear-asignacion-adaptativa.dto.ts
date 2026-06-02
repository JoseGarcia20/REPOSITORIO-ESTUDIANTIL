import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearAsignacionAdaptativaDto {
  @IsInt()
  @Min(1)
  estudianteId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  docenteId?: number;

  @IsString()
  @MaxLength(220)
  tema: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  objetivo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  nivelSolicitado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  tiempoDisponible?: string;

  @IsOptional()
  @IsDateString()
  fechaLimite?: string;
}
