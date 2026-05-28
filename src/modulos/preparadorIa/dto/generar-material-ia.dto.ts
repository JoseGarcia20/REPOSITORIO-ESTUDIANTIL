import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const TIPOS_MATERIAL_IA = [
  'guia_clase',
  'taller',
  'lectura',
  'evaluacion',
  'resumen',
] as const;

export const EXTENSIONES_MATERIAL_IA = ['breve', 'normal', 'extenso'] as const;

export type TipoMaterialIa = (typeof TIPOS_MATERIAL_IA)[number];
export type ExtensionMaterialIa = (typeof EXTENSIONES_MATERIAL_IA)[number];

export class GenerarMaterialIaDto {
  @IsString()
  @MaxLength(1000)
  tema!: string;

  @IsString()
  gradoEscolarId!: string;

  @IsOptional()
  @IsString()
  institucionId?: string;

  @IsOptional()
  @IsString()
  categoriaId?: string;

  @IsOptional()
  @IsString()
  @IsIn(TIPOS_MATERIAL_IA)
  tipoMaterial?: TipoMaterialIa;

  @IsOptional()
  @IsString()
  @IsIn(EXTENSIONES_MATERIAL_IA)
  extension?: ExtensionMaterialIa;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instruccionesAdicionales?: string;
}
