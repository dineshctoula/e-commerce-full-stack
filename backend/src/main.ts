import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Register helmet to secure headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

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
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps, curl, or postman) or any localhost port
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
