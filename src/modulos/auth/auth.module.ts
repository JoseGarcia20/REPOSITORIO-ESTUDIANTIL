import 'dotenv/config';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controladores/auth.controller';
import { AuthService } from './servicios/auth.service';
import { PermisosGuard } from './guards/permisos.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'clave_temporal_desarrollo',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, PermisosGuard],
  exports: [JwtModule, JwtAuthGuard, PermisosGuard],
})
export class AuthModule {}
