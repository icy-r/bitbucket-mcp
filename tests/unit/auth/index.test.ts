import { describe, it, expect } from 'vitest';
import { createAuthProvider } from '../../../src/auth/index.js';
import { ApiTokenAuthProvider } from '../../../src/auth/api-token.js';
import { BasicAuthProvider } from '../../../src/auth/basic-auth.js';
import { OAuth2AuthProvider } from '../../../src/auth/oauth2.js';
import type { Config } from '../../../src/config/settings.js';

const baseConfig: Config = {
  authMethod: 'api_token',
  baseUrl: 'https://api.bitbucket.org/2.0',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  logLevel: 'info',
};

describe('createAuthProvider', () => {
  it('should create ApiTokenAuthProvider for api_token method', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'api_token',
      apiToken: 'test-token',
    };
    const provider = createAuthProvider(config);
    expect(provider).toBeInstanceOf(ApiTokenAuthProvider);
  });

  it('should create ApiTokenAuthProvider for repository_token method', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'repository_token',
      apiToken: 'repo-token',
    };
    const provider = createAuthProvider(config);
    expect(provider).toBeInstanceOf(ApiTokenAuthProvider);
  });

  it('should create ApiTokenAuthProvider for workspace_token method', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'workspace_token',
      apiToken: 'workspace-token',
    };
    const provider = createAuthProvider(config);
    expect(provider).toBeInstanceOf(ApiTokenAuthProvider);
  });

  it('should create BasicAuthProvider for basic method', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'basic',
      username: 'testuser',
      password: 'testpass',
    };
    const provider = createAuthProvider(config);
    expect(provider).toBeInstanceOf(BasicAuthProvider);
  });

  it('should create OAuth2AuthProvider for oauth method', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'oauth',
      oauthClientId: 'client-id',
      oauthClientSecret: 'client-secret',
    };
    const provider = createAuthProvider(config);
    expect(provider).toBeInstanceOf(OAuth2AuthProvider);
  });

  it('should throw error for api_token without token', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'api_token',
    };
    expect(() => createAuthProvider(config)).toThrow('BITBUCKET_API_TOKEN is required');
  });

  it('should throw error for basic auth without credentials', () => {
    const config: Config = {
      ...baseConfig,
      authMethod: 'basic',
    };
    expect(() => createAuthProvider(config)).toThrow(
      'BITBUCKET_USERNAME and BITBUCKET_PASSWORD are required'
    );
  });
});

