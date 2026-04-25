import {
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class ActualizarDetalleDiagnosticoAprendizajeDto {

  @IsOptional()
  @IsNumber()
  @Min(0)
  puntaje?: number;

  @IsOptional()
  @IsInt()
  diagnosticoAprendizajeId?: number;

  @IsOptional()
  @IsInt()
  tipoAprendizajeId?: number;

}