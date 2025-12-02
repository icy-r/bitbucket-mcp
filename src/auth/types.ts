/**
 * Authentication provider interface
 */
export interface AuthProvider {
  /**
   * Get the authorization header value
   */
  getAuthHeader(): Promise<string>;

  /**
   * Check if the credentials are valid
   */
  validate(): Promise<boolean>;

  /**
   * Refresh credentials if applicable (e.g., OAuth tokens)
   */
  refresh?(): Promise<void>;

  /**
   * Get the auth method name
   */
  getMethodName(): string;
}

/**
 * OAuth token response
 */
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scopes?: string;
}

/**
 * OAuth configuration
 */
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  tokenUrl?: string;
}

/**
 * Basic auth configuration
 */
export interface BasicAuthConfig {
  username: string;
  password: string;
}

/**
 * API token configuration
 * 
 * Per Bitbucket documentation:
 * "To authenticate with an API token, use Basic HTTP Authentication as per RFC-2617,
 * where the username is your Atlassian email and password is the API token."
 */
export interface ApiTokenConfig {
  token: string;
  userEmail: string;
}

/**
 * Access token configuration (Repository/Workspace/Project tokens)
 * These use Bearer authentication
 */
export interface AccessTokenConfig {
  token: string;
}
