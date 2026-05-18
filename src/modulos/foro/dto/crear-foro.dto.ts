import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CrearForoDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsOptional()
  @IsBoolean()
  publico?: boolean;

  @IsOptional()
  @IsInt()
  institucionId?: number;

  @IsOptional()
  @IsInt()
  categoriaId?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  categoriaIds?: number[];
}
