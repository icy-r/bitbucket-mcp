import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../../../src/config/settings.js';

describe('loadConfig - NaN handling for numeric env vars', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should fall back to default timeout when BITBUCKET_TIMEOUT is non-numeric', () => {
    process.env.BITBUCKET_TIMEOUT = 'abc';
    const config = loadConfig();
    expect(config.timeout).toBe(30000);
  });

  it('should fall back to default retryDelay when BITBUCKET_RETRY_DELAY is non-numeric', () => {
    process.env.BITBUCKET_RETRY_DELAY = 'not-a-number';
    const config = loadConfig();
    expect(config.retryDelay).toBe(1000);
  });

  it('should fall back to default maxRetries when BITBUCKET_MAX_RETRIES is non-numeric', () => {
    process.env.BITBUCKET_MAX_RETRIES = 'xyz';
    const config = loadConfig();
    expect(config.maxRetries).toBe(3);
  });

  it('should accept valid numeric timeout', () => {
    process.env.BITBUCKET_TIMEOUT = '60000';
    const config = loadConfig();
    expect(config.timeout).toBe(60000);
  });

  it('should accept zero for maxRetries', () => {
    process.env.BITBUCKET_MAX_RETRIES = '0';
    const config = loadConfig();
    expect(config.maxRetries).toBe(0);
  });

  it('should accept valid numeric retryDelay', () => {
    process.env.BITBUCKET_RETRY_DELAY = '2000';
    const config = loadConfig();
    expect(config.retryDelay).toBe(2000);
  });
});
