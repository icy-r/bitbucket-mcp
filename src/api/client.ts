import type { AuthProvider } from '../auth/index.js';
import type { Config } from '../config/settings.js';
import { getEffectiveBaseUrl } from '../config/settings.js';
import { parseAPIError, RateLimitError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { PaginatedResponse } from '../utils/pagination.js';

/**
 * HTTP method type
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request options
 */
export interface RequestOptions {
  method?: HttpMethod;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Bitbucket API client with retry logic and pagination support
 */
export class BitbucketClient {
  private readonly baseUrl: string;
  private readonly authProvider: AuthProvider;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(config: Config, authProvider: AuthProvider) {
    this.baseUrl = getEffectiveBaseUrl(config);
    this.authProvider = authProvider;
    this.timeout = config.timeout;
    this.maxRetries = config.maxRetries;
    this.retryDelay = config.retryDelay;
  }

  /**
   * Make an API request
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', params, body, headers = {}, timeout = this.timeout } = options;

    // Build URL with query parameters
    const url = this.buildUrl(endpoint, params);

    // Get auth header
    const authHeader = await this.authProvider.getAuthHeader();

    // Build request headers
    const requestHeaders: Record<string, string> = {
      Authorization: authHeader,
      Accept: 'application/json',
      ...headers,
    };

    if (body && method !== 'GET') {
      requestHeaders['Content-Type'] = 'application/json';
    }

    // Make request with retry logic
    return this.executeWithRetry<T>(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      timeout,
    });
  }

  /**
   * GET request helper
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST request helper
   */
  async post<T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, params });
  }

  /**
   * PUT request helper
   */
  async put<T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, params });
  }

  /**
   * PATCH request helper
   */
  async patch<T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, params });
  }

  /**
   * DELETE request helper
   */
  async delete<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', params });
  }

  /**
   * Get raw content (for file downloads)
   */
  async getRaw(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<string> {
    const url = this.buildUrl(endpoint, params);
    const authHeader = await this.authProvider.getAuthHeader();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      throw parseAPIError(response.status, endpoint, await response.text());
    }

    return response.text();
  }

  /**
   * Paginated GET request
   */
  async getPaginated<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(endpoint, params);
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    // Handle absolute URLs (for pagination next links)
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    const url = new URL(endpoint.startsWith('/') ? endpoint.slice(1) : endpoint, this.baseUrl + '/');

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    url: string,
    init: RequestInit & { timeout?: number }
  ): Promise<T> {
    let lastError: Error | undefined;
    let retryCount = 0;

    while (retryCount <= this.maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), init.timeout ?? this.timeout);

        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          const error = parseAPIError(response.status, url, errorBody);

          // Don't retry on client errors (except rate limits)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw error;
          }

          // Handle rate limiting
          if (error instanceof RateLimitError) {
            const retryAfter = error.retryAfter ?? this.retryDelay / 1000;
            logger.warn(`Rate limited. Waiting ${retryAfter} seconds before retry`);
            await this.sleep(retryAfter * 1000);
            retryCount++;
            lastError = error;
            continue;
          }

          throw error;
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (!contentType || response.status === 204) {
          return {} as T;
        }

        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof Error) {
          // Don't retry on abort or client errors
          if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${init.timeout ?? this.timeout}ms`);
          }

          lastError = error;

          // Only retry on network errors or server errors
          if (retryCount < this.maxRetries) {
            const delay = this.retryDelay * Math.pow(2, retryCount);
            logger.warn(`Request failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`, {
              error: error.message,
            });
            await this.sleep(delay);
            retryCount++;
            continue;
          }
        }

        throw error;
      }
    }

    throw lastError ?? new Error('Request failed after maximum retries');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

