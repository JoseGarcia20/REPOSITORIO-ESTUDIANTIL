import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CrearDetalleRutaAprendizajeDto {

  @IsInt()
  @Min(1)
  orden!: number;

  @IsString()
  @IsNotEmpty()
  tituloPaso!: string;

  @IsString()
  @IsNotEmpty()
  tipoPaso!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsInt()
  rutaAprendizajeId!: number;

  @IsOptional()
  @IsInt()
  recursoId?: number;

}