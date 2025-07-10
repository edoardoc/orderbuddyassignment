import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RestaurantModule } from './restaurant/restaurant.module';
import { Logger, LoggerModule } from 'nestjs-pino';
import { MongoDbDriverModule } from 'nest-mongodb-driver';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiConfigModule } from './config/config.module';
import { PaymentsModule } from './payments/payments.module';
import { MenuModule } from './menu/menu.module';
import { EventsModule } from './events/events.module';
const logLevel = process.env.NODE_ENV === 'local' ? 'debug' : 'info';
import * as admin from 'firebase-admin';
import { WebPushModule } from './web-push/web-push.module';
import { AuthModule } from './auth/auth.module';
import { OrderAppModule } from './order-app/order-app.module';
import { MongoIndexInitializer } from './db/mongo-index-initializer';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { StationsModule } from './stations/stations.module';
import { AiModule } from './ai/ai.module';
import { OriginsModule } from './origins/origins.module';
import { StorageModule } from './storage/storage.module';
import { AzureInsightsMiddleware } from './middleware/appInsights.middleware';
import { MessageModule } from './message/message.module';
import { PrintersModule } from './printers/printers.module';

@Module({
  imports: [
    ApiConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'trace',
        customProps: (req, res) => ({
          context: 'HTTP',
        }),
        transport: {
          targets: [
            {
              target: 'pino-pretty',
              level: 'trace',
              options: {
                colorize: true,
                singleLine: true,
              },
            },
          ],
        },
      },
    }),
    AuthModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const connectionURI = configService.get<string>('SUPERTOKENS_CONNECTION_URI');
        const apiKey = configService.get<string>('SUPERTOKENS_API_KEY');
        const apiDomain = configService.get<string>('API_ENDPOINT');
        const websiteDomain = configService.get<string>('STORE_ENDPOINT');

        if (!connectionURI || !apiKey || !apiDomain || !websiteDomain) {
          throw new Error('Required auth configuration is missing');
        }

        return {
          connectionURI,
          apiKey,
          appInfo: {
            appName: 'OrderBuddy',
            apiDomain,
            websiteDomain,
            apiBasePath: '/login',
            websiteBasePath: '/login',
          },
        };
      },
      inject: [ConfigService],
    }),
    MongoDbDriverModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DB_CONN_STRING');
        const dbName = configService.get<string>('DB_NAME');

        if (!url || !dbName) {
          throw new Error('Database configuration is missing');
        }

        return { url, dbName };
      },
      inject: [ConfigService],
    }),

    ConfigModule.forRoot({
      load: [
        () => {
          return {
            firebase: admin.initializeApp({
              credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              }),
            }),
          };
        },
      ],
    }),

    WebPushModule,
    EventsModule,
    RestaurantModule,
    PaymentsModule,
    MenuModule,
    OrderAppModule,
    AuthModule,
    StationsModule,
    AiModule,
    OriginsModule,
    StorageModule,
    MessageModule,
    PrintersModule,
  ],
  controllers: [],
  providers: [MongoIndexInitializer, Logger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*'); // Apply middleware globally
  }
}
