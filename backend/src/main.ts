import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Register the global validation pipe to enforce class-validator rules on DTO inputs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // automatically strip properties that do not have any decorators in the DTO
      transform: true, // automatically transform payloads to be objects typed as DTO classes
    }),
  );

  // Register cookie-parser to extract cookies for HttpOnly token validation
  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
