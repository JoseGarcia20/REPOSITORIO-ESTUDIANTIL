import { IsNotEmpty, IsString } from 'class-validator';

export class ActualizarEstadoActividadDto {
  @IsString()
  @IsNotEmpty()
  estado!: string;
}
