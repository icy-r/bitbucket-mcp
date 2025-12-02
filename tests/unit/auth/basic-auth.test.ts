import { describe, it, expect } from 'vitest';
import { BasicAuthProvider } from '../../../src/auth/basic-auth.js';

describe('BasicAuthProvider', () => {
  describe('constructor', () => {
    it('should create provider with valid credentials', () => {
      const provider = new BasicAuthProvider({
        username: 'testuser',
        password: 'testpass',
      });
      expect(provider).toBeDefined();
      expect(provider.getMethodName()).toBe('basic');
    });

    it('should throw error when username is missing', () => {
      expect(
        () =>
          new BasicAuthProvider({
            username: '',
            password: 'testpass',
          })
      ).toThrow('Username is required');
    });

    it('should throw error when password is missing', () => {
      expect(
        () =>
          new BasicAuthProvider({
            username: 'testuser',
            password: '',
          })
      ).toThrow('Password is required');
    });
  });

  describe('getAuthHeader', () => {
    it('should return Basic auth header with base64 encoded credentials', async () => {
      const provider = new BasicAuthProvider({
        username: 'testuser',
        password: 'testpass',
      });
      const header = await provider.getAuthHeader();

      // testuser:testpass in base64
      const expectedBase64 = Buffer.from('testuser:testpass').toString('base64');
      expect(header).toBe(`Basic ${expectedBase64}`);
    });

    it('should handle special characters in credentials', async () => {
      const provider = new BasicAuthProvider({
        username: 'user@email.com',
        password: 'p@ss:word!',
      });
      const header = await provider.getAuthHeader();

      const expectedBase64 = Buffer.from('user@email.com:p@ss:word!').toString('base64');
      expect(header).toBe(`Basic ${expectedBase64}`);
    });
  });

  describe('validate', () => {
    it('should return true for valid credentials', async () => {
      const provider = new BasicAuthProvider({
        username: 'testuser',
        password: 'testpass',
      });
      const isValid = await provider.validate();
      expect(isValid).toBe(true);
    });
  });

  describe('getMethodName', () => {
    it('should return basic', () => {
      const provider = new BasicAuthProvider({
        username: 'test',
        password: 'test',
      });
      expect(provider.getMethodName()).toBe('basic');
    });
  });
});

