import { describe, it, expect } from 'vitest';
import {
  BitbucketMCPError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  ConfigurationError,
  BitbucketAPIError,
  parseAPIError,
  formatErrorForMCP,
} from '../../../src/utils/errors.js';

describe('Error Classes', () => {
  describe('BitbucketMCPError', () => {
    it('should create error with all properties', () => {
      const error = new BitbucketMCPError('Test error', 'TEST_CODE', 500, { foo: 'bar' });
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ foo: 'bar' });
      expect(error.name).toBe('BitbucketMCPError');
    });
  });

  describe('AuthenticationError', () => {
    it('should create 401 error', () => {
      const error = new AuthenticationError('Invalid token');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('AuthorizationError', () => {
    it('should create 403 error', () => {
      const error = new AuthorizationError('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.name).toBe('AuthorizationError');
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error with resource info', () => {
      const error = new NotFoundError('Repository', 'my-repo');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Repository not found: my-repo');
    });
  });

  describe('RateLimitError', () => {
    it('should create 429 error with retry info', () => {
      const error = new RateLimitError(60);
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.retryAfter).toBe(60);
      expect(error.message).toContain('Retry after 60 seconds');
    });

    it('should create error without retry info', () => {
      const error = new RateLimitError();
      expect(error.message).toBe('Rate limit exceeded');
    });
  });

  describe('ValidationError', () => {
    it('should create 400 error', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('ConfigurationError', () => {
    it('should create error without status code', () => {
      const error = new ConfigurationError('Missing config');
      expect(error.statusCode).toBeUndefined();
      expect(error.code).toBe('CONFIGURATION_ERROR');
    });
  });

  describe('BitbucketAPIError', () => {
    it('should create error with endpoint info', () => {
      const error = new BitbucketAPIError('API failed', 500, '/repos/test');
      expect(error.statusCode).toBe(500);
      expect(error.endpoint).toBe('/repos/test');
      expect(error.code).toBe('BITBUCKET_API_ERROR');
    });
  });
});

describe('parseAPIError', () => {
  it('should return AuthenticationError for 401', () => {
    const error = parseAPIError(401, '/test', { error: { message: 'Unauthorized' } });
    expect(error).toBeInstanceOf(AuthenticationError);
  });

  it('should return AuthorizationError for 403', () => {
    const error = parseAPIError(403, '/test', { message: 'Forbidden' });
    expect(error).toBeInstanceOf(AuthorizationError);
  });

  it('should return NotFoundError for 404', () => {
    const error = parseAPIError(404, '/repos/test', {});
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should return RateLimitError for 429', () => {
    const error = parseAPIError(429, '/test', { retry_after: 30 });
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfter).toBe(30);
  });

  it('should return BitbucketAPIError for other codes', () => {
    const error = parseAPIError(500, '/test', { message: 'Server error' });
    expect(error).toBeInstanceOf(BitbucketAPIError);
    expect(error.statusCode).toBe(500);
  });
});

describe('formatErrorForMCP', () => {
  it('should format BitbucketMCPError', () => {
    const error = new ValidationError('Bad input');
    const result = formatErrorForMCP(error);
    expect(result).toEqual({
      message: 'Bad input',
      code: 'VALIDATION_ERROR',
    });
  });

  it('should format standard Error', () => {
    const error = new Error('Something went wrong');
    const result = formatErrorForMCP(error);
    expect(result).toEqual({
      message: 'Something went wrong',
      code: 'UNKNOWN_ERROR',
    });
  });

  it('should format non-Error values', () => {
    const result = formatErrorForMCP('string error');
    expect(result).toEqual({
      message: 'string error',
      code: 'UNKNOWN_ERROR',
    });
  });
});

