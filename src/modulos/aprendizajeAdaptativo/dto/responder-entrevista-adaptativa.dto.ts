import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RespuestaEntrevistaAdaptativaDto {
  @IsString()
  @MaxLength(80)
  preguntaId: string;

  @IsString()
  @MaxLength(1200)
  respuesta: string;
}

export class ResponderEntrevistaAdaptativaDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => RespuestaEntrevistaAdaptativaDto)
  respuestas: RespuestaEntrevistaAdaptativaDto[];
}
