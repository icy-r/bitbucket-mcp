import type { AuthProvider, ApiTokenConfig, AccessTokenConfig } from './types.js';
import { AuthenticationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * API Token authentication provider for Bitbucket Cloud
 * 
 * Per Bitbucket documentation:
 * "To authenticate with an API token, use Basic HTTP Authentication as per RFC-2617,
 * where the username is your Atlassian email and password is the API token."
 * 
 * This is different from Repository/Workspace/Project Access Tokens which use Bearer auth.
 */
export class ApiTokenAuthProvider implements AuthProvider {
  private readonly token: string;
  private readonly userEmail: string;

  constructor(config: ApiTokenConfig) {
    if (!config.token) {
      throw new AuthenticationError('API token is required');
    }
    if (!config.userEmail) {
      throw new AuthenticationError(
        'User email is required for API token authentication. ' +
        'API tokens use Basic HTTP Authentication where username is your Atlassian email.'
      );
    }
    this.token = config.token;
    this.userEmail = config.userEmail;
  }

  async getAuthHeader(): Promise<string> {
    // API tokens use Basic auth with email:token
    const credentials = Buffer.from(`${this.userEmail}:${this.token}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async validate(): Promise<boolean> {
    if (!this.token || this.token.trim().length === 0) {
      logger.error('API token is empty or invalid');
      return false;
    }
    if (!this.userEmail || this.userEmail.trim().length === 0) {
      logger.error('User email is empty or invalid');
      return false;
    }
    return true;
  }

  getMethodName(): string {
    return 'api_token';
  }
}

/**
 * Access Token authentication provider for Bitbucket Cloud
 * Supports: Repository Access Tokens, Workspace Access Tokens, Project Access Tokens
 * 
 * These tokens use Bearer authentication, unlike personal API tokens.
 */
export class AccessTokenAuthProvider implements AuthProvider {
  private readonly token: string;
  private readonly tokenType: 'repository' | 'workspace' | 'project';

  constructor(config: AccessTokenConfig, tokenType: 'repository' | 'workspace' | 'project' = 'repository') {
    if (!config.token) {
      throw new AuthenticationError(`${tokenType} access token is required`);
    }
    this.token = config.token;
    this.tokenType = tokenType;
  }

  async getAuthHeader(): Promise<string> {
    // Access tokens use Bearer auth
    return `Bearer ${this.token}`;
  }

  async validate(): Promise<boolean> {
    if (!this.token || this.token.trim().length === 0) {
      logger.error(`${this.tokenType} access token is empty or invalid`);
      return false;
    }
    return true;
  }

  getMethodName(): string {
    return `${this.tokenType}_token`;
  }
}
