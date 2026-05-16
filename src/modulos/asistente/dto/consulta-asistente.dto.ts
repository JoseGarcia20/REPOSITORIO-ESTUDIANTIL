import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ConsultaAsistenteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  pregunta!: string;
}
