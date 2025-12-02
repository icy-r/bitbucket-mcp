import { describe, it, expect } from 'vitest';
import {
  buildPaginationParams,
  extractPageFromUrl,
  hasMorePages,
  DEFAULT_PAGE_LENGTH,
  MAX_PAGE_LENGTH,
} from '../../../src/utils/pagination.js';

describe('buildPaginationParams', () => {
  it('should return default pagelen when no options provided', () => {
    const params = buildPaginationParams();
    expect(params).toEqual({
      pagelen: String(DEFAULT_PAGE_LENGTH),
    });
  });

  it('should include page when provided', () => {
    const params = buildPaginationParams({ page: 2 });
    expect(params).toEqual({
      page: '2',
      pagelen: String(DEFAULT_PAGE_LENGTH),
    });
  });

  it('should use custom pagelen', () => {
    const params = buildPaginationParams({ pagelen: 50 });
    expect(params).toEqual({
      pagelen: '50',
    });
  });

  it('should cap pagelen at MAX_PAGE_LENGTH', () => {
    const params = buildPaginationParams({ pagelen: 200 });
    expect(params).toEqual({
      pagelen: String(MAX_PAGE_LENGTH),
    });
  });

  it('should handle all options together', () => {
    const params = buildPaginationParams({ page: 3, pagelen: 10 });
    expect(params).toEqual({
      page: '3',
      pagelen: '10',
    });
  });
});

describe('extractPageFromUrl', () => {
  it('should extract page number from URL', () => {
    const url = 'https://api.bitbucket.org/2.0/repositories?page=5&pagelen=25';
    const page = extractPageFromUrl(url);
    expect(page).toBe(5);
  });

  it('should return undefined when no page param', () => {
    const url = 'https://api.bitbucket.org/2.0/repositories?pagelen=25';
    const page = extractPageFromUrl(url);
    expect(page).toBeUndefined();
  });

  it('should return undefined for invalid URL', () => {
    const page = extractPageFromUrl('not-a-url');
    expect(page).toBeUndefined();
  });
});

describe('hasMorePages', () => {
  it('should return true when next is present', () => {
    const response = {
      values: [],
      next: 'https://api.bitbucket.org/2.0/repositories?page=2',
    };
    expect(hasMorePages(response)).toBe(true);
  });

  it('should return false when next is absent', () => {
    const response = {
      values: [],
    };
    expect(hasMorePages(response)).toBe(false);
  });

  it('should return false when next is undefined', () => {
    const response = {
      values: [],
      next: undefined,
    };
    expect(hasMorePages(response)).toBe(false);
  });
});

