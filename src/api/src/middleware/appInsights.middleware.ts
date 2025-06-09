import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as appInsights from 'applicationinsights';
import { Logger } from 'nestjs-pino/Logger';
@Injectable()
export class AzureInsightsMiddleware implements NestMiddleware {
  private client: appInsights.TelemetryClient;

  constructor(private readonly logger: Logger) {}

  async onModuleInit() {
    try {
      // Initialize App Insights
      const setup = appInsights
        .setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true)
        .setUseDiskRetryCaching(true);

      // Start the client
      await setup.start();

      this.client = appInsights.defaultClient;

      // Verify client initialization
      if (!this.client) {
        throw new Error('App Insights client failed to initialize');
      }

      this.logger.debug('Application Insights initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Application Insights:', error);
      throw error;
    }
  }
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req['requestId'];
    const startTime = Date.now();

    // Set operation context
    this.client.context.tags[this.client.context.keys.operationId] = correlationId;

    // Track request with correlation
    this.client.trackTrace({
      message: `Request started: ${req.method} ${req.url}`,
      properties: {
        correlationId,
        method: req.method,
        url: req.url,
        component: 'API',
      },
    });

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      this.client.trackRequest({
        name: `${req.method} ${req.url}`,
        url: req.url,
        duration,
        resultCode: res.statusCode.toString(),
        success: res.statusCode < 400,
        properties: {
          correlationId,
          component: 'API',
        },
      });
    });

    next();
  }
}
