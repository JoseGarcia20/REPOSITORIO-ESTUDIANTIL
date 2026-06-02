import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RevisarAsignacionAdaptativaDto {
  @IsIn(['completada', 'reasignada'])
  decision: 'completada' | 'reasignada';

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  observaciones?: string;
}
