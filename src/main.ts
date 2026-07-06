import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';

function validateEnv() {
  const required = [
    'DATABASE_URL',
    'CLERK_SECRET_KEY',
    'LIVEBLOCKS_SECRET_KEY',
    'LIVEBLOCKS_WEBHOOK_SECRET',
    'FRONTEND_URL',
  ] as const;

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error('');
    console.error('╔═══════════════════════════════════════════════════════════╗');
    console.error('║          MISSING REQUIRED ENVIRONMENT VARIABLES          ║');
    console.error('╚═══════════════════════════════════════════════════════════╝');
    console.error('');
    for (const key of missing) {
      console.error(`  • ${key}`);
    }
    console.error('');
    console.error('Copy .env.example to .env and fill in the values.');
    console.error(
      'See Notion or ask a teammate for the current values if you are on the team.',
    );
    console.error('');
    process.exit(1);
  }

  const port = process.env.PORT;
  if (port && isNaN(Number(port))) {
    console.error(`PORT must be a number, got "${port}"`);
    process.exit(1);
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Design Tool API')
    .setDescription('API documentation for the Design Tool application')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 5002);
}
bootstrap();
