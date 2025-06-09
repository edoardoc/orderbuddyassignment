import { Inject, Injectable, Logger } from '@nestjs/common';
import supertokens from 'supertokens-node';
import Session from 'supertokens-node/recipe/session';
import Passwordless from 'supertokens-node/recipe/passwordless';
import { ConfigInjectionToken, AuthModuleConfig } from '../config.interface';

@Injectable()
export class SupertokensService {
  private readonly logger = new Logger(SupertokensService.name);
  constructor(@Inject(ConfigInjectionToken) private config: AuthModuleConfig) {
    supertokens.init({
      appInfo: {
        appName: config.appInfo.appName,
        apiDomain: config.appInfo.apiDomain,
        websiteDomain: config.appInfo.websiteDomain,
        apiBasePath: '/login',
        websiteBasePath: '/login',
      },
      supertokens: {
        connectionURI: config.connectionURI,
        apiKey: config.apiKey,
      },
      recipeList: [
        Passwordless.init({
          flowType: 'USER_INPUT_CODE',
          contactMethod: 'EMAIL_OR_PHONE',
          override: {
            functions: (originalImplementation) => {
              return {
                ...originalImplementation,
                consumeCode: async (input) => {
                  let response = await originalImplementation.consumeCode(input);
                  if (response.status === 'OK') {
                    if (input.session === undefined) {
                      if (response.createdNewRecipeUser && response.user.loginMethods.length === 1) {
                        this.logger.debug('New user signed up with passwordless');
                      } else {
                        this.logger.debug('User logged in with passwordless');
                      }
                    }
                    this.logger.debug('User: ' + JSON.stringify(response.user));
                  }
                  return response;
                },
              };
            },
          },
        }),
        Session.init({
          cookieSecure: true,
          exposeAccessTokenToFrontendInCookieBasedAuth: true,
        }),
      ],
    });
  }
}
