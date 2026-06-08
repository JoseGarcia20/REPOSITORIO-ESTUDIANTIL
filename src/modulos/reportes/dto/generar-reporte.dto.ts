import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const TIPOS_REPORTE = [
  'recursos-institucion',
  'trabajos-colaborativos',
  'recursos-uso',
  'calificaciones-ia',
] as const;

export type TipoReporte = (typeof TIPOS_REPORTE)[number];

export class GenerarReporteDto {
  @IsString()
  @IsIn(TIPOS_REPORTE)
  tipo!: TipoReporte;

  @IsOptional()
  @IsString()
  fechaInicio?: string;

  @IsOptional()
  @IsString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  institucionId?: string;

  @IsOptional()
  @IsString()
  categoriaId?: string;

  @IsOptional()
  @IsString()
  gradoEscolarId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  estadoProyecto?: string;

  @IsOptional()
  @IsString()
  @IsIn(['todos', 'foros', 'aula', 'rutas', 'calificaciones'])
  moduloUso?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'todos',
    'recursos',
    'preparador_ia',
    'asistente',
    'aprendizaje_adaptativo',
  ])
  moduloIa?: string;

  @IsOptional()
  @IsString()
  limite?: string;
}
