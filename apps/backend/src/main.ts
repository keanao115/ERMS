import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('ERMS-Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security Headers via Helmet
  app.use(helmet());

  // Global CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  });

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  // Swagger OpenAPI Specs
  const config = new DocumentBuilder()
    .setTitle('Enterprise Restaurant Management System (ERMS) API')
    .setDescription('Production-grade REST & WebSockets API specification for multi-branch restaurant enterprise operations.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`🚀 ERMS Backend Service running on port ${port}`);
  logger.log(`📚 OpenAPI Docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
