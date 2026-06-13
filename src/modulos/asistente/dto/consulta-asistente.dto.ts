import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class MensajeHistorialDto {
  @IsIn(['usuario', 'asistente'])
  rol!: 'usuario' | 'asistente';

  @IsString()
  @MaxLength(2000)
  contenido!: string;
}

export class ConsultaAsistenteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  pregunta!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  conversacionId?: number | null;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => MensajeHistorialDto)
  @IsOptional()
  historial?: MensajeHistorialDto[];
}
