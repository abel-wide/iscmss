import 'dotenv/config';
import * as dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('ISCMS API')
    .setDescription('Integrated School Community Management System API')
    .setVersion('1.0')
    .addBearerAuth() // ለ JWT Token ማረጋገጫ
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // በ /api/docs ላይ ይከፈታል

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();