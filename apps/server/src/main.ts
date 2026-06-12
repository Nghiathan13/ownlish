import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { env } from './config/env';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.enableCors({
    credentials: true,
    origin: env.corsOrigin,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(env.port);
  logger.log(`Server is running on port ${env.port}`);
  logger.log(`CORS origin: ${env.corsOrigin}`);
}
bootstrap();
