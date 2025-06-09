import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);

  app.useLogger(logger);
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const config = new DocumentBuilder()
    .setTitle('OrderBuddy API')
    .setDescription('REST API for Order and Manage apps')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  // app.useGlobalFilters(new SupertokensExceptionFilter())

  const configService = app.get(ConfigService);
  const storeEndpoint = configService.get('STORE_ENDPOINT');
  const menuEndpoint = configService.get('MENU_ENDPOINT');
  const useEmulator = configService.get('USEEMULATOR');

  const allowedOrigins = [storeEndpoint, menuEndpoint];

  if (useEmulator === 'true') {
    const LOCALHOSTURL = process.env.LOCALHOSTURL;
    allowedOrigins.push(LOCALHOSTURL);
  }

  app.enableCors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies or authorization headers
  });

  const port = configService.get('PORT');
  await app.listen(port);

  logger.log(`OrderBuddy API running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Error starting application:', err);
  process.exit(1);
});
