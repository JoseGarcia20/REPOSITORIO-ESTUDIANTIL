import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RespuestaEvaluacionAdaptativaDto {
  @IsString()
  @MaxLength(80)
  preguntaId: string;

  @IsString()
  @MaxLength(1600)
  respuesta: string;
}

export class EnviarEvaluacionAdaptativaDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => RespuestaEvaluacionAdaptativaDto)
  respuestas: RespuestaEvaluacionAdaptativaDto[];
}
