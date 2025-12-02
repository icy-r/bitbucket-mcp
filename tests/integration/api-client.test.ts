import { describe, it, expect } from 'vitest';
import { BitbucketClient } from '../../src/api/client.js';
import { ApiTokenAuthProvider } from '../../src/auth/api-token.js';
import type { Config } from '../../src/config/settings.js';

const testConfig: Config = {
  authMethod: 'api_token',
  apiToken: 'test-token',
  baseUrl: 'https://api.bitbucket.org/2.0',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  logLevel: 'error',
};

describe('BitbucketClient Integration', () => {
  const authProvider = new ApiTokenAuthProvider({ token: 'test-token' });
  const client = new BitbucketClient(testConfig, authProvider);

  describe('GET requests', () => {
    it('should fetch workspaces', async () => {
      const response = await client.get<{ values: unknown[] }>('/workspaces');
      expect(response).toBeDefined();
      expect(response.values).toBeInstanceOf(Array);
    });

    it('should fetch a specific workspace', async () => {
      const response = await client.get<{ slug: string }>('/workspaces/test-workspace');
      expect(response).toBeDefined();
      expect(response.slug).toBe('test-workspace');
    });

    it('should fetch repositories', async () => {
      const response = await client.get<{ values: unknown[] }>('/repositories/test-workspace');
      expect(response).toBeDefined();
      expect(response.values).toBeInstanceOf(Array);
    });
  });

  describe('Pagination', () => {
    it('should handle paginated responses', async () => {
      const response = await client.getPaginated<{ name: string }>(
        '/repositories/test-workspace/test-repo/refs/branches'
      );
      expect(response).toBeDefined();
      expect(response.values).toBeInstanceOf(Array);
      expect(response.size).toBeDefined();
    });
  });
});

