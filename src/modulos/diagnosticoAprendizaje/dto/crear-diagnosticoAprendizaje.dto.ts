import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CrearDiagnosticoAprendizajeDto {

  @IsInt()
  usuarioId!: number;

  @IsInt()
  tipoAprendizajeId!: number;

  @IsNumber()
  puntajeFinal!: number;

  @IsOptional()
  @IsString()
  resultadoFinal?: string;

}