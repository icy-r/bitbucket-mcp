import { describe, it, expect } from 'vitest';
import { ApiTokenAuthProvider } from '../../../src/auth/api-token.js';

describe('ApiTokenAuthProvider', () => {
  describe('constructor', () => {
    it('should create provider with valid token and email', () => {
      const provider = new ApiTokenAuthProvider({ token: 'test-token', userEmail: 'test@example.com' });
      expect(provider).toBeDefined();
      expect(provider.getMethodName()).toBe('api_token');
    });

    it('should throw error when token is empty', () => {
      expect(() => new ApiTokenAuthProvider({ token: '', userEmail: 'test@example.com' })).toThrow('API token is required');
    });

    it('should throw error when email is missing', () => {
      expect(() => new ApiTokenAuthProvider({ token: 'test-token' })).toThrow('User email is required');
    });
  });

  describe('getAuthHeader', () => {
    it('should return Basic auth header with email:token', async () => {
      const provider = new ApiTokenAuthProvider({ token: 'test-token-123', userEmail: 'test@example.com' });
      const header = await provider.getAuthHeader();
      // Basic auth: base64(email:token)
      const expected = 'Basic ' + Buffer.from('test@example.com:test-token-123').toString('base64');
      expect(header).toBe(expected);
    });
  });

  describe('validate', () => {
    it('should return true for valid token', async () => {
      const provider = new ApiTokenAuthProvider({ token: 'valid-token', userEmail: 'test@example.com' });
      const isValid = await provider.validate();
      expect(isValid).toBe(true);
    });
  });

  describe('getMethodName', () => {
    it('should return api_token', () => {
      const provider = new ApiTokenAuthProvider({ token: 'test', userEmail: 'test@example.com' });
      expect(provider.getMethodName()).toBe('api_token');
    });
  });
});
