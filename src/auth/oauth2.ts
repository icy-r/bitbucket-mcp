import type { AuthProvider, OAuthConfig, OAuthTokenResponse } from './types.js';
import { AuthenticationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const BITBUCKET_TOKEN_URL = 'https://bitbucket.org/site/oauth2/access_token';

/**
 * OAuth 2.0 authentication provider for Bitbucket Cloud
 * Supports client credentials flow and token refresh
 */
export class OAuth2AuthProvider implements AuthProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tokenUrl: string;
  private accessToken: string | undefined;
  private refreshToken: string | undefined;
  private tokenExpiry: Date | undefined;

  constructor(config: OAuthConfig) {
    if (!config.clientId || !config.clientSecret) {
      if (!config.accessToken) {
        throw new AuthenticationError(
          'OAuth requires either client credentials or an access token'
        );
      }
    }
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.tokenUrl = config.tokenUrl ?? BITBUCKET_TOKEN_URL;
  }

  async getAuthHeader(): Promise<string> {
    await this.ensureValidToken();
    return `Bearer ${this.accessToken}`;
  }

  async validate(): Promise<boolean> {
    try {
      await this.ensureValidToken();
      return !!this.accessToken;
    } catch (error) {
      logger.error('OAuth validation failed', error);
      return false;
    }
  }

  async refresh(): Promise<void> {
    if (this.refreshToken) {
      await this.refreshAccessToken();
    } else if (this.clientId && this.clientSecret) {
      await this.fetchClientCredentialsToken();
    } else {
      throw new AuthenticationError('Cannot refresh token: no refresh token or client credentials');
    }
  }

  getMethodName(): string {
    return 'oauth';
  }

  private async ensureValidToken(): Promise<void> {
    // If we have a valid token that hasn't expired, use it
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return;
    }

    // If we have a refresh token, try to refresh
    if (this.refreshToken) {
      await this.refreshAccessToken();
      return;
    }

    // If we have client credentials, get a new token
    if (this.clientId && this.clientSecret) {
      await this.fetchClientCredentialsToken();
      return;
    }

    // If we have an access token but no expiry info, assume it's valid
    if (this.accessToken) {
      return;
    }

    throw new AuthenticationError('No valid authentication method available');
  }

  private async fetchClientCredentialsToken(): Promise<void> {
    logger.debug('Fetching OAuth token using client credentials');

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AuthenticationError(`Failed to obtain OAuth token: ${error}`);
    }

    const data = (await response.json()) as OAuthTokenResponse;
    this.updateTokens(data);
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new AuthenticationError('No refresh token available');
    }

    logger.debug('Refreshing OAuth access token');

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(this.refreshToken)}`,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AuthenticationError(`Failed to refresh OAuth token: ${error}`);
    }

    const data = (await response.json()) as OAuthTokenResponse;
    this.updateTokens(data);
  }

  private updateTokens(data: OAuthTokenResponse): void {
    this.accessToken = data.access_token;

    if (data.refresh_token) {
      this.refreshToken = data.refresh_token;
    }

    if (data.expires_in) {
      // Set expiry with a 5-minute buffer
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000);
    }

    logger.debug('OAuth tokens updated successfully');
  }
}

