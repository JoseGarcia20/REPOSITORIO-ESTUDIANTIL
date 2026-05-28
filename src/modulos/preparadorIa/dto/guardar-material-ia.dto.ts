import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EXTENSIONES_MATERIAL_IA,
  TIPOS_MATERIAL_IA,
  type ExtensionMaterialIa,
  type TipoMaterialIa,
} from './generar-material-ia.dto';

class SeccionMaterialIaDto {
  @IsString()
  @MaxLength(160)
  titulo!: string;

  @IsString()
  contenido!: string;
}

class FuenteMaterialIaDto {
  @IsString()
  @MaxLength(220)
  titulo!: string;

  @IsString()
  url!: string;
}

export class GuardarMaterialIaDto {
  @IsString()
  @MaxLength(220)
  titulo!: string;

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
  tipoRecursoId?: string;

  @IsString()
  @IsIn(TIPOS_MATERIAL_IA)
  tipoMaterial!: TipoMaterialIa;

  @IsString()
  @IsIn(EXTENSIONES_MATERIAL_IA)
  extension!: ExtensionMaterialIa;

  @IsString()
  introduccion!: string;

  @IsArray()
  objetivos!: string[];

  @IsArray()
  conceptosClave!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeccionMaterialIaDto)
  secciones!: SeccionMaterialIaDto[];

  @IsString()
  actividadClase!: string;

  @IsArray()
  preguntasComprension!: string[];

  @IsString()
  cierre!: string;

  @IsArray()
  palabrasClave!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FuenteMaterialIaDto)
  fuentes!: FuenteMaterialIaDto[];

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;
}
