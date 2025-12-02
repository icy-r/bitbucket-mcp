/**
 * Base error class for Bitbucket MCP errors
 */
export class BitbucketMCPError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'BitbucketMCPError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends BitbucketMCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error (forbidden)
 */
export class AuthorizationError extends BitbucketMCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends BitbucketMCPError {
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends BitbucketMCPError {
  constructor(
    public readonly retryAfter?: number,
    details?: unknown
  ) {
    super(
      `Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter} seconds` : ''}`,
      'RATE_LIMIT_ERROR',
      429,
      details
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Validation error for invalid input
 */
export class ValidationError extends BitbucketMCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends BitbucketMCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIGURATION_ERROR', undefined, details);
    this.name = 'ConfigurationError';
  }
}

/**
 * API error from Bitbucket
 */
export class BitbucketAPIError extends BitbucketMCPError {
  constructor(
    message: string,
    statusCode: number,
    public readonly endpoint: string,
    details?: unknown
  ) {
    super(message, 'BITBUCKET_API_ERROR', statusCode, details);
    this.name = 'BitbucketAPIError';
  }
}

/**
 * Parse error response from Bitbucket API
 */
export function parseAPIError(
  statusCode: number,
  endpoint: string,
  responseBody: unknown
): BitbucketMCPError {
  const body = responseBody as Record<string, unknown> | undefined;
  const errorMessage =
    (body?.error as Record<string, unknown>)?.message ??
    (body?.message as string) ??
    'Unknown error';

  switch (statusCode) {
    case 401:
      return new AuthenticationError(errorMessage, responseBody);
    case 403:
      return new AuthorizationError(errorMessage, responseBody);
    case 404:
      return new NotFoundError('Resource', endpoint);
    case 429:
      const retryAfter = body?.retry_after as number | undefined;
      return new RateLimitError(retryAfter, responseBody);
    default:
      return new BitbucketAPIError(errorMessage, statusCode, endpoint, responseBody);
  }
}

/**
 * Format error for MCP response
 */
export function formatErrorForMCP(error: unknown): { message: string; code: string } {
  if (error instanceof BitbucketMCPError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    };
  }

  return {
    message: String(error),
    code: 'UNKNOWN_ERROR',
  };
}

