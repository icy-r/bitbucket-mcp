import { z } from 'zod';

/**
 * Bitbucket pagination response schema
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    size: z.number().optional(),
    page: z.number().optional(),
    pagelen: z.number().optional(),
    next: z.string().url().optional(),
    previous: z.string().url().optional(),
    values: z.array(itemSchema),
  });

export type PaginatedResponse<T> = {
  size?: number;
  page?: number;
  pagelen?: number;
  next?: string;
  previous?: string;
  values: T[];
};

/**
 * Pagination options for list requests
 */
export interface PaginationOptions {
  page?: number;
  pagelen?: number;
  maxPages?: number;
}

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE_LENGTH = 25;
export const MAX_PAGE_LENGTH = 100;
export const DEFAULT_MAX_PAGES = 10;

/**
 * Build query parameters for pagination
 */
export function buildPaginationParams(options?: PaginationOptions): Record<string, string> {
  const params: Record<string, string> = {};

  if (options?.page) {
    params.page = String(options.page);
  }

  const pagelen = Math.min(options?.pagelen ?? DEFAULT_PAGE_LENGTH, MAX_PAGE_LENGTH);
  params.pagelen = String(pagelen);

  return params;
}

/**
 * Extract page number from a URL
 */
export function extractPageFromUrl(url: string): number | undefined {
  try {
    const urlObj = new URL(url);
    const page = urlObj.searchParams.get('page');
    return page ? parseInt(page, 10) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Check if there are more pages
 */
export function hasMorePages(response: PaginatedResponse<unknown>): boolean {
  return !!response.next;
}

/**
 * Async generator for paginating through results
 */
export async function* paginateResults<T>(
  fetchPage: (page: number, pagelen: number) => Promise<PaginatedResponse<T>>,
  options?: PaginationOptions
): AsyncGenerator<T[], void, unknown> {
  const pagelen = Math.min(options?.pagelen ?? DEFAULT_PAGE_LENGTH, MAX_PAGE_LENGTH);
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
  let currentPage = options?.page ?? 1;
  let pageCount = 0;

  while (pageCount < maxPages) {
    const response = await fetchPage(currentPage, pagelen);
    yield response.values;

    if (!response.next) {
      break;
    }

    currentPage++;
    pageCount++;
  }
}

/**
 * Collect all paginated results into a single array
 */
export async function collectAllPages<T>(
  fetchPage: (page: number, pagelen: number) => Promise<PaginatedResponse<T>>,
  options?: PaginationOptions
): Promise<T[]> {
  const results: T[] = [];

  for await (const page of paginateResults(fetchPage, options)) {
    results.push(...page);
  }

  return results;
}

/**
 * Format a paginated response for MCP tool output
 * Returns a simplified object with values and pagination info
 */
export function paginateResult<T>(response: PaginatedResponse<T>): {
  values: T[];
  pagination: {
    page?: number;
    pagelen?: number;
    size?: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
} {
  return {
    values: response.values,
    pagination: {
      page: response.page,
      pagelen: response.pagelen,
      size: response.size,
      hasNext: !!response.next,
      hasPrevious: !!response.previous,
    },
  };
}

