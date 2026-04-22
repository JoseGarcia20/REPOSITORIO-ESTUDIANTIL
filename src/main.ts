import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); //Habilita CORS para permitir solicitudes desde otros dominios (REACT)

  //Habilita la validacion global de los DTOs utilizando class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades que no están definidas en el DTO
      forbidNonWhitelisted: true, // Lanza un error si se envían propiedades no definidas en el DTO
      transform: true, // Transforma los payloads a los tipos definidos en los DTOs (por ejemplo, convierte strings a números si el DTO lo especifica)
    }),
  ); 

  await app.listen(3000); //Confiigura el puerto en el que deseas que la aplicación escuche
}
bootstrap();
