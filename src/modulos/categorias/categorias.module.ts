import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CategoriasController } from './controladores/categorias.controller';
import { CategoriasService } from './servicios/categorias.service';

@Module({
  imports: [AuthModule],
  controllers: [CategoriasController],
  providers: [CategoriasService],
})
export class CategoriasModule {}