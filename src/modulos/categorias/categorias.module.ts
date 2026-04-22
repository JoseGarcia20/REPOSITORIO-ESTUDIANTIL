import { Module } from '@nestjs/common';
import { CategoriasController } from './controladores/categorias.controller';
import { CategoriasService } from './servicios/categorias.service';

@Module({
  controllers: [CategoriasController],
  providers: [CategoriasService],
})
export class CategoriasModule {}