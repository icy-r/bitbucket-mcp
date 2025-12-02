import type { Config } from '../config/settings.js';
import type { AuthProvider } from './types.js';
import { ApiTokenAuthProvider, AccessTokenAuthProvider } from './api-token.js';
import { BasicAuthProvider } from './basic-auth.js';
import { OAuth2AuthProvider } from './oauth2.js';
import { ConfigurationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export type { AuthProvider } from './types.js';
export { ApiTokenAuthProvider, AccessTokenAuthProvider } from './api-token.js';
export { BasicAuthProvider } from './basic-auth.js';
export { OAuth2AuthProvider } from './oauth2.js';

/**
 * Factory function to create the appropriate auth provider based on configuration
 */
export function createAuthProvider(config: Config): AuthProvider {
  logger.debug(`Creating auth provider for method: ${config.authMethod}`);

  switch (config.authMethod) {
    case 'api_token':
      // API tokens use Basic auth with email:token (per Bitbucket documentation)
      if (!config.apiToken) {
        throw new ConfigurationError(
          'BITBUCKET_API_TOKEN (or ATLASSIAN_API_TOKEN) is required for api_token authentication'
        );
      }
      if (!config.userEmail) {
        throw new ConfigurationError(
          'BITBUCKET_USER_EMAIL (or ATLASSIAN_USER_EMAIL) is required for api_token authentication. ' +
          'API tokens use Basic HTTP Authentication where username is your Atlassian email.'
        );
      }
      return new ApiTokenAuthProvider({
        token: config.apiToken,
        userEmail: config.userEmail,
      });

    case 'repository_token':
      // Repository access tokens use Bearer auth
      if (!config.apiToken) {
        throw new ConfigurationError(
          'BITBUCKET_API_TOKEN is required for repository_token authentication'
        );
      }
      return new AccessTokenAuthProvider({ token: config.apiToken }, 'repository');

    case 'workspace_token':
      // Workspace access tokens use Bearer auth
      if (!config.apiToken) {
        throw new ConfigurationError(
          'BITBUCKET_API_TOKEN is required for workspace_token authentication'
        );
      }
      return new AccessTokenAuthProvider({ token: config.apiToken }, 'workspace');

    case 'oauth':
      return new OAuth2AuthProvider({
        clientId: config.oauthClientId ?? '',
        clientSecret: config.oauthClientSecret ?? '',
        accessToken: config.oauthAccessToken,
        refreshToken: config.oauthRefreshToken,
      });

    case 'basic':
      if (!config.username || !config.password) {
        throw new ConfigurationError(
          'BITBUCKET_USERNAME and BITBUCKET_PASSWORD are required for basic authentication'
        );
      }
      return new BasicAuthProvider({
        username: config.username,
        password: config.password,
      });

    default:
      throw new ConfigurationError(`Unknown authentication method: ${config.authMethod}`);
  }
}

/**
 * Validate auth provider credentials
 */
export async function validateAuth(provider: AuthProvider): Promise<boolean> {
  try {
    const isValid = await provider.validate();
    if (isValid) {
      logger.info(`Authentication validated successfully using ${provider.getMethodName()}`);
    } else {
      logger.error(`Authentication validation failed for ${provider.getMethodName()}`);
    }
    return isValid;
  } catch (error) {
    logger.error('Authentication validation error', error);
    return false;
  }
}
