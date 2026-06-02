import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RespuestaEvaluacionAdaptativaDto } from './enviar-evaluacion-adaptativa.dto';

export class GuardarEvaluacionAdaptativaDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => RespuestaEvaluacionAdaptativaDto)
  respuestas?: RespuestaEvaluacionAdaptativaDto[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  motivo?: string;
}
