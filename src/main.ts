import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.enableCors({
    origin: [config.getOrThrow<string>('ALLOWED_ORIGIN')],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kanban board')
    .setDescription('Kanban board API description')
    .setVersion('1.0')
    .addTag('kanban board')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(config.getOrThrow<string>('APP_PORT'));
}

bootstrap();
