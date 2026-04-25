import {
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';

export class CrearDetalleDiagnosticoAprendizajeDto {

  @IsNumber()
  @Min(0)
  puntaje!: number;

  @IsInt()
  diagnosticoAprendizajeId!: number;

  @IsInt()
  tipoAprendizajeId!: number;

}