import { z } from 'zod';

/**
 * Authentication method enum
 */
export const AuthMethod = z.enum(['api_token', 'oauth', 'basic', 'repository_token', 'workspace_token']);
export type AuthMethod = z.infer<typeof AuthMethod>;

/**
 * Output format enum for API responses
 * - json: Full JSON output (default, backward compatible)
 * - toon: TOON format (50-70% token savings)
 * - compact: Essential fields only in TOON format (up to 76% token savings)
 */
export const OutputFormat = z.enum(['json', 'toon', 'compact']);
export type OutputFormat = z.infer<typeof OutputFormat>;

/**
 * Environment configuration schema with validation
 */
export const ConfigSchema = z.object({
  // Authentication
  authMethod: AuthMethod.default('api_token'),
  apiToken: z.string().optional(),
  userEmail: z.string().optional(), // Required for API token auth (Basic auth with email:token)
  oauthClientId: z.string().optional(),
  oauthClientSecret: z.string().optional(),
  oauthAccessToken: z.string().optional(),
  oauthRefreshToken: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  
  // Bitbucket settings
  baseUrl: z.string().url().default('https://api.bitbucket.org/2.0'),
  serverUrl: z.string().url().optional(),
  workspace: z.string().optional(),
  
  // Output format (TOON optimization for LLM token savings)
  outputFormat: OutputFormat.default('json'),
  
  // HTTP settings
  timeout: z.number().positive().default(30000),
  maxRetries: z.number().nonnegative().default(3),
  retryDelay: z.number().positive().default(1000),
  
  // Logging
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Load configuration from environment variables
 * Supports both BITBUCKET_* and ATLASSIAN_* prefixes for compatibility
 */
export function loadConfig(): Config {
  // Support both BITBUCKET_* and ATLASSIAN_* environment variables
  const apiToken = process.env.BITBUCKET_API_TOKEN ?? process.env.ATLASSIAN_API_TOKEN;
  const userEmail = process.env.BITBUCKET_USER_EMAIL ?? process.env.ATLASSIAN_USER_EMAIL ?? process.env.BITBUCKET_USERNAME;
  
  const rawConfig = {
    authMethod: process.env.BITBUCKET_AUTH_METHOD ?? 'api_token',
    apiToken,
    userEmail,
    oauthClientId: process.env.BITBUCKET_OAUTH_CLIENT_ID,
    oauthClientSecret: process.env.BITBUCKET_OAUTH_CLIENT_SECRET,
    oauthAccessToken: process.env.BITBUCKET_OAUTH_ACCESS_TOKEN,
    oauthRefreshToken: process.env.BITBUCKET_OAUTH_REFRESH_TOKEN,
    username: process.env.BITBUCKET_USERNAME,
    password: process.env.BITBUCKET_PASSWORD ?? process.env.BITBUCKET_APP_PASSWORD,
    baseUrl: process.env.BITBUCKET_BASE_URL ?? 'https://api.bitbucket.org/2.0',
    serverUrl: process.env.BITBUCKET_SERVER_URL,
    workspace: process.env.BITBUCKET_WORKSPACE,
    outputFormat: process.env.BITBUCKET_OUTPUT_FORMAT ?? 'json',
    timeout: process.env.BITBUCKET_TIMEOUT ? parseInt(process.env.BITBUCKET_TIMEOUT, 10) : 30000,
    maxRetries: process.env.BITBUCKET_MAX_RETRIES ? parseInt(process.env.BITBUCKET_MAX_RETRIES, 10) : 3,
    retryDelay: process.env.BITBUCKET_RETRY_DELAY ? parseInt(process.env.BITBUCKET_RETRY_DELAY, 10) : 1000,
    logLevel: process.env.BITBUCKET_LOG_LEVEL ?? 'info',
  };

  return ConfigSchema.parse(rawConfig);
}

/**
 * Validate that required auth credentials are present for the selected method
 */
export function validateAuthConfig(config: Config): void {
  switch (config.authMethod) {
    case 'api_token':
      // API tokens require both email and token (Basic auth with email:token per RFC-2617)
      if (!config.apiToken) {
        throw new Error(
          'BITBUCKET_API_TOKEN (or ATLASSIAN_API_TOKEN) is required for api_token authentication'
        );
      }
      if (!config.userEmail) {
        throw new Error(
          'BITBUCKET_USER_EMAIL (or ATLASSIAN_USER_EMAIL) is required for api_token authentication. ' +
          'API tokens use Basic HTTP Authentication where username is your Atlassian email.'
        );
      }
      break;
    case 'repository_token':
    case 'workspace_token':
      // Repository/Workspace access tokens use Bearer auth
      if (!config.apiToken) {
        throw new Error(`BITBUCKET_API_TOKEN is required for ${config.authMethod} authentication`);
      }
      break;
    case 'oauth':
      if (!config.oauthAccessToken && (!config.oauthClientId || !config.oauthClientSecret)) {
        throw new Error(
          'OAuth authentication requires either BITBUCKET_OAUTH_ACCESS_TOKEN or both BITBUCKET_OAUTH_CLIENT_ID and BITBUCKET_OAUTH_CLIENT_SECRET'
        );
      }
      break;
    case 'basic':
      if (!config.username || !config.password) {
        throw new Error(
          'Basic authentication requires both BITBUCKET_USERNAME and BITBUCKET_PASSWORD (or BITBUCKET_APP_PASSWORD)'
        );
      }
      break;
  }
}

/**
 * Get the effective base URL (server URL for Bitbucket Server/DC)
 */
export function getEffectiveBaseUrl(config: Config): string {
  if (config.authMethod === 'basic' && config.serverUrl) {
    // Bitbucket Server/DC uses a different API path
    return `${config.serverUrl}/rest/api/1.0`;
  }
  return config.baseUrl;
}
