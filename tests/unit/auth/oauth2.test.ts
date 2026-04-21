import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OAuth2AuthProvider } from '../../../src/auth/oauth2.js';

describe('OAuth2AuthProvider', () => {
  describe('constructor', () => {
    it('should create provider with valid client credentials', () => {
      const provider = new OAuth2AuthProvider({
        clientId: 'client-id',
        clientSecret: 'client-secret',
      });
      expect(provider).toBeDefined();
      expect(provider.getMethodName()).toBe('oauth');
    });

    it('should create provider with access token only', () => {
      const provider = new OAuth2AuthProvider({
        clientId: '',
        clientSecret: '',
        accessToken: 'my-access-token',
      });
      expect(provider).toBeDefined();
    });

    it('should throw when no client credentials and no access token', () => {
      expect(
        () => new OAuth2AuthProvider({ clientId: '', clientSecret: '' })
      ).toThrow('OAuth requires either client credentials or an access token');
    });

    it('should reject whitespace-only client credentials without access token', () => {
      expect(
        () => new OAuth2AuthProvider({ clientId: '   ', clientSecret: '   ' })
      ).toThrow('OAuth requires either client credentials or an access token');
    });

    it('should accept whitespace-only client credentials when access token is provided', () => {
      const provider = new OAuth2AuthProvider({
        clientId: '   ',
        clientSecret: '   ',
        accessToken: 'valid-token',
      });
      expect(provider).toBeDefined();
    });

    it('should reject when only clientId is provided without access token', () => {
      expect(
        () => new OAuth2AuthProvider({ clientId: 'id', clientSecret: '' })
      ).toThrow('OAuth requires either client credentials or an access token');
    });
  });

  describe('getAuthHeader', () => {
    it('should return Bearer header with existing access token', async () => {
      const provider = new OAuth2AuthProvider({
        clientId: '',
        clientSecret: '',
        accessToken: 'my-token',
      });
      const header = await provider.getAuthHeader();
      expect(header).toBe('Bearer my-token');
    });
  });

  describe('validate', () => {
    it('should return true when access token is present', async () => {
      const provider = new OAuth2AuthProvider({
        clientId: '',
        clientSecret: '',
        accessToken: 'valid-token',
      });
      const result = await provider.validate();
      expect(result).toBe(true);
    });
  });

  describe('refresh concurrency', () => {
    it('should not make concurrent refresh calls', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          expires_in: 3600,
          token_type: 'bearer',
        }),
      });
      vi.stubGlobal('fetch', fetchSpy);

      const provider = new OAuth2AuthProvider({
        clientId: 'client-id',
        clientSecret: 'client-secret',
      });

      // Call getAuthHeader concurrently — should only trigger one fetch
      const [header1, header2, header3] = await Promise.all([
        provider.getAuthHeader(),
        provider.getAuthHeader(),
        provider.getAuthHeader(),
      ]);

      expect(header1).toBe('Bearer new-token');
      expect(header2).toBe('Bearer new-token');
      expect(header3).toBe('Bearer new-token');
      // Only one token fetch should have been made
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      vi.unstubAllGlobals();
    });
  });

  describe('getMethodName', () => {
    it('should return oauth', () => {
      const provider = new OAuth2AuthProvider({
        clientId: '',
        clientSecret: '',
        accessToken: 'token',
      });
      expect(provider.getMethodName()).toBe('oauth');
    });
  });
});
