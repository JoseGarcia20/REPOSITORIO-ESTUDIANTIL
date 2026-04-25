import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class ActualizarDiagnosticoAprendizajeDto {

  @IsOptional()
  @IsInt()
  usuarioId?: number;

  @IsOptional()
  @IsInt()
  tipoAprendizajeId?: number;

  @IsOptional()
  @IsNumber()
  puntajeFinal?: number;

  @IsOptional()
  @IsString()
  resultadoFinal?: string;

}