import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { join } from 'path';
import express from 'express';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from './baseDatos/prisma/prisma.service';
import { FiltroExcepcionesGlobal } from './comun/filtros/filtro-excepciones-global';

// Prisma BigInt fields (e.g. auditoria_logs.id) cannot be serialized to JSON by default.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.enableCors(); //Habilita CORS para permitir solicitudes desde otros dominios (REACT)
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  registrarPeticionesHttp(app.getHttpAdapter().getInstance());
  protegerUploads(app.getHttpAdapter().getInstance(), app);

  //Habilita la validacion global de los DTOs utilizando class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades que no están definidas en el DTO
      forbidNonWhitelisted: true, // Lanza un error si se envían propiedades no definidas en el DTO
      transform: true, // Transforma los payloads a los tipos definidos en los DTOs (por ejemplo, convierte strings a números si el DTO lo especifica)
    }),
  );

  app.useGlobalFilters(new FiltroExcepcionesGlobal());

  const puerto = Number(process.env.PORT || 3000);    
  await app.listen(puerto, '0.0.0.0'); //Configuracion del puerto en el que desee que la aplicación escuche
}
bootstrap();

function registrarPeticionesHttp(expressApp: any) {
  const logger = new Logger('HTTP');

  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    const inicio = Date.now();

    res.on('finish', () => {
      const duracion = Date.now() - inicio;
      const ruta = req.originalUrl || req.url;
      const ip = req.ip || req.socket.remoteAddress || 'sin-ip';
      const mensaje = `${req.method} ${ruta} ${res.statusCode} ${duracion}ms ${ip}`;

      if (res.statusCode >= 500) {
        logger.error(mensaje);
      } else if (res.statusCode >= 400) {
        logger.warn(mensaje);
      } else {
        logger.log(mensaje);
      }
    });

    next();
  });
}

function obtenerTokenArchivo(req: Request) {
  const authorization = req.headers.authorization;

  if (authorization?.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '').trim();
  }

  const tokenQuery = req.query.token;
  if (typeof tokenQuery === 'string') {
    return tokenQuery;
  }

  return '';
}

function protegerUploads(
  expressApp: any,
  app: Awaited<ReturnType<typeof NestFactory.create>>,
) {
  const jwtService = app.get(JwtService);
  const prisma = app.get(PrismaService);
  const servirUploads = express.static(join(process.cwd(), 'uploads'), {
    dotfiles: 'deny',
    index: false,
  });

  expressApp.use(
    '/uploads',
    async (req: Request, res: Response, next: NextFunction) => {
      const token = obtenerTokenArchivo(req);

      if (!token) {
        return res.status(401).json({ message: 'Autenticación requerida' });
      }

      try {
        const payload = await jwtService.verifyAsync(token);
        const usuario = await prisma.usuario.findUnique({
          where: { id: Number(payload?.sub) },
          select: {
            id: true,
            activo: true,
            rol: { select: { estado: true } },
          },
        });

        if (!usuario?.activo || !usuario.rol.estado) {
          return res.status(401).json({ message: 'Usuario no autorizado' });
        }

        permitirVistaEmbebidaDeUploads(req, res);
        return servirUploads(req, res, next);
      } catch {
        return res.status(401).json({ message: 'Token inválido o expirado' });
      }
    },
  );
}

function permitirVistaEmbebidaDeUploads(req: Request, res: Response) {
  const origenes = obtenerOrigenesFrontendPermitidos();

  res.removeHeader('X-Frame-Options');
  res.setHeader(
    'Content-Security-Policy',
    `frame-ancestors 'self' ${origenes.join(' ')}`,
  );
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  if (req.path.toLowerCase().endsWith('.pdf')) {
    res.setHeader('Content-Disposition', 'inline');
  }
}

function obtenerOrigenesFrontendPermitidos() {
  const base = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ];
  const configurados = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS,
    process.env.APP_URL,
  ]
    .filter(Boolean)
    .flatMap((valor) => String(valor).split(','))
    .map((valor) => valor.trim())
    .filter(Boolean)
    .map((valor) => {
      try {
        return new URL(valor).origin;
      } catch {
        return valor.replace(/\/+$/, '');
      }
    });

  return Array.from(new Set([...base, ...configurados]));
}
