import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class IntegranteProyectoDto {
  @IsInt()
  usuarioId!: number;

  @IsString()
  @IsNotEmpty()
  rolProyecto!: string;
}

export class CrearProyectoColaborativoDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsString()
  @IsNotEmpty()
  objetivo!: string;

  @IsOptional()
  @IsString()
  curso?: string;

  @IsOptional()
  @IsString()
  instrucciones?: string;

  @IsDateString()
  fechaLimite!: string;

  @IsOptional()
  @IsInt()
  institucionId?: number;

  @IsOptional()
  @IsInt()
  gradoEscolarId?: number;

  @IsOptional()
  @IsInt()
  categoriaId?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => IntegranteProyectoDto)
  integrantes!: IntegranteProyectoDto[];
}
