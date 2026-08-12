import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { AppModule } from './app.module';

(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};
(Prisma.Decimal.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return this.toNumber();
};

async function bootstrap() {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  if (nodeEnv === 'production') {
    if (process.env.DEV_MODE === 'true') {
      throw new Error('DEV_MODE=true запрещён в production');
    }
    const required = ['DATABASE_URL', 'AUTH_SECRET', 'BOT_TOKEN'];
    const missing = required.filter((name) => !process.env[name]);
    if (missing.length) {
      throw new Error(`Отсутствуют обязательные переменные окружения: ${missing.join(', ')}`);
    }
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
      throw new Error('AUTH_SECRET должен быть длиной не менее 16 символов');
    }
  }

  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const defaultOrigins = nodeEnv === 'production' ? [] : ['http://localhost:5173'];

  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : defaultOrigins || false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
  );

  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Мани.точка API')
    .setDescription('API планировщика личного бюджета')
    .setVersion('0.2.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`API запущено: http://localhost:${port}/api`);
}
bootstrap();