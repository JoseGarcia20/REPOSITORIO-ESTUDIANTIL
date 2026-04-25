import {
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ActualizarDetalleRutaAprendizajeDto {

  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;

  @IsOptional()
  @IsString()
  tituloPaso?: string;

  @IsOptional()
  @IsString()
  tipoPaso?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  rutaAprendizajeId?: number;

  @IsOptional()
  @IsInt()
  recursoId?: number;

}