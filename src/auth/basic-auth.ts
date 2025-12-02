import type { AuthProvider, BasicAuthConfig } from './types.js';
import { AuthenticationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Basic authentication provider for Bitbucket Server/Data Center
 * Also works with Bitbucket Cloud using username + app password
 */
export class BasicAuthProvider implements AuthProvider {
  private readonly username: string;
  private readonly password: string;

  constructor(config: BasicAuthConfig) {
    if (!config.username) {
      throw new AuthenticationError('Username is required for basic authentication');
    }
    if (!config.password) {
      throw new AuthenticationError('Password is required for basic authentication');
    }
    this.username = config.username;
    this.password = config.password;
  }

  async getAuthHeader(): Promise<string> {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async validate(): Promise<boolean> {
    if (!this.username || !this.password) {
      logger.error('Basic auth credentials are incomplete');
      return false;
    }
    return true;
  }

  getMethodName(): string {
    return 'basic';
  }
}

