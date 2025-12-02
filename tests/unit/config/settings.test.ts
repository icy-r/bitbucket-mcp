import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadConfig,
  validateAuthConfig,
  getEffectiveBaseUrl,
  type Config,
} from '../../../src/config/settings.js';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load default config when no env vars set', () => {
    const config = loadConfig();
    expect(config.authMethod).toBe('api_token');
    expect(config.baseUrl).toBe('https://api.bitbucket.org/2.0');
    expect(config.timeout).toBe(30000);
    expect(config.maxRetries).toBe(3);
    expect(config.retryDelay).toBe(1000);
    expect(config.logLevel).toBe('info');
  });

  it('should load config from environment variables', () => {
    process.env.BITBUCKET_AUTH_METHOD = 'basic';
    process.env.BITBUCKET_USERNAME = 'testuser';
    process.env.BITBUCKET_PASSWORD = 'testpass';
    process.env.BITBUCKET_TIMEOUT = '60000';
    process.env.BITBUCKET_LOG_LEVEL = 'debug';

    const config = loadConfig();
    expect(config.authMethod).toBe('basic');
    expect(config.username).toBe('testuser');
    expect(config.password).toBe('testpass');
    expect(config.timeout).toBe(60000);
    expect(config.logLevel).toBe('debug');
  });

  it('should support BITBUCKET_APP_PASSWORD as fallback for password', () => {
    process.env.BITBUCKET_AUTH_METHOD = 'basic';
    process.env.BITBUCKET_USERNAME = 'testuser';
    process.env.BITBUCKET_APP_PASSWORD = 'app-password';

    const config = loadConfig();
    expect(config.password).toBe('app-password');
  });
});

describe('validateAuthConfig', () => {
  const baseConfig: Config = {
    authMethod: 'api_token',
    baseUrl: 'https://api.bitbucket.org/2.0',
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    logLevel: 'info',
  };

  it('should not throw for valid api_token config', () => {
    const config: Config = { ...baseConfig, apiToken: 'test-token', userEmail: 'test@example.com' };
    expect(() => validateAuthConfig(config)).not.toThrow();
  });

  it('should throw for api_token without token', () => {
    expect(() => validateAuthConfig(baseConfig)).toThrow(
      'BITBUCKET_API_TOKEN (or ATLASSIAN_API_TOKEN) is required'
    );
  });

  it('should not throw for valid basic auth config', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'basic',
      username: 'user',
      password: 'pass',
    };
    expect(() => validateAuthConfig(config)).not.toThrow();
  });

  it('should throw for basic auth without username', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'basic',
      password: 'pass',
    };
    expect(() => validateAuthConfig(config)).toThrow(
      'BITBUCKET_USERNAME and BITBUCKET_PASSWORD'
    );
  });

  it('should throw for basic auth without password', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'basic',
      username: 'user',
    };
    expect(() => validateAuthConfig(config)).toThrow(
      'BITBUCKET_USERNAME and BITBUCKET_PASSWORD'
    );
  });

  it('should not throw for oauth with access token', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'oauth',
      oauthAccessToken: 'access-token',
    };
    expect(() => validateAuthConfig(config)).not.toThrow();
  });

  it('should not throw for oauth with client credentials', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'oauth',
      oauthClientId: 'client-id',
      oauthClientSecret: 'client-secret',
    };
    expect(() => validateAuthConfig(config)).not.toThrow();
  });

  it('should throw for oauth without any credentials', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'oauth',
    };
    expect(() => validateAuthConfig(config)).toThrow('OAuth authentication requires');
  });
});

describe('getEffectiveBaseUrl', () => {
  const baseConfig: Config = {
    authMethod: 'api_token',
    baseUrl: 'https://api.bitbucket.org/2.0',
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    logLevel: 'info',
  };

  it('should return default baseUrl for api_token', () => {
    const url = getEffectiveBaseUrl(baseConfig);
    expect(url).toBe('https://api.bitbucket.org/2.0');
  });

  it('should return server URL for basic auth with server URL', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'basic',
      serverUrl: 'https://bitbucket.mycompany.com',
    };
    const url = getEffectiveBaseUrl(config);
    expect(url).toBe('https://bitbucket.mycompany.com/rest/api/1.0');
  });

  it('should return default baseUrl for basic auth without server URL', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'basic',
    };
    const url = getEffectiveBaseUrl(config);
    expect(url).toBe('https://api.bitbucket.org/2.0');
  });
});

