import { describe, it, expect } from 'vitest';
import { ApiTokenAuthProvider } from '../../../src/auth/api-token.js';

describe('ApiTokenAuthProvider', () => {
  describe('constructor', () => {
    it('should create provider with valid token', () => {
      const provider = new ApiTokenAuthProvider({ token: 'test-token' });
      expect(provider).toBeDefined();
      expect(provider.getMethodName()).toBe('api_token');
    });

    it('should throw error when token is empty', () => {
      expect(() => new ApiTokenAuthProvider({ token: '' })).toThrow('API token is required');
    });
  });

  describe('getAuthHeader', () => {
    it('should return Bearer token header', async () => {
      const provider = new ApiTokenAuthProvider({ token: 'test-token-123' });
      const header = await provider.getAuthHeader();
      expect(header).toBe('Bearer test-token-123');
    });
  });

  describe('validate', () => {
    it('should return true for valid token', async () => {
      const provider = new ApiTokenAuthProvider({ token: 'valid-token' });
      const isValid = await provider.validate();
      expect(isValid).toBe(true);
    });
  });

  describe('getMethodName', () => {
    it('should return api_token', () => {
      const provider = new ApiTokenAuthProvider({ token: 'test' });
      expect(provider.getMethodName()).toBe('api_token');
    });
  });
});

