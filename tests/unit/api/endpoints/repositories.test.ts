import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepositoriesAPI } from '../../../../src/api/endpoints/repositories.js';
import { BitbucketClient } from '../../../../src/api/client.js';

describe('RepositoriesAPI', () => {
  let mockClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getRaw: ReturnType<typeof vi.fn>;
    getPaginated: ReturnType<typeof vi.fn>;
  };
  let api: RepositoriesAPI;

  beforeEach(() => {
    mockClient = {
      get: vi.fn().mockResolvedValue({}),
      post: vi.fn().mockResolvedValue({}),
      put: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
      getRaw: vi.fn().mockResolvedValue('raw content'),
      getPaginated: vi.fn().mockResolvedValue({ values: [], page: 1, pagelen: 25, size: 0 }),
    };
    api = new RepositoriesAPI(mockClient as unknown as BitbucketClient);
  });

  describe('getDiff - URL encoding', () => {
    it('should URL-encode simple branch names in diff spec', async () => {
      await api.getDiff('ws', 'repo', 'main..develop');
      expect(mockClient.getRaw).toHaveBeenCalledWith(
        '/repositories/ws/repo/diff/main..develop'
      );
    });

    it('should URL-encode branch names with slashes in diff spec', async () => {
      await api.getDiff('ws', 'repo', 'main..feature/my-branch');
      expect(mockClient.getRaw).toHaveBeenCalledWith(
        '/repositories/ws/repo/diff/main..feature%2Fmy-branch'
      );
    });

    it('should URL-encode branch names with special characters', async () => {
      await api.getDiff('ws', 'repo', 'release/v1.0..feature/test+fix');
      expect(mockClient.getRaw).toHaveBeenCalledWith(
        '/repositories/ws/repo/diff/release%2Fv1.0..feature%2Ftest%2Bfix'
      );
    });

    it('should handle commit hashes (no encoding needed)', async () => {
      await api.getDiff('ws', 'repo', 'abc123..def456');
      expect(mockClient.getRaw).toHaveBeenCalledWith(
        '/repositories/ws/repo/diff/abc123..def456'
      );
    });
  });

  describe('getDiffStat - URL encoding', () => {
    it('should URL-encode branch names in diffstat spec', async () => {
      await api.getDiffStat('ws', 'repo', 'main..feature/branch');
      expect(mockClient.getPaginated).toHaveBeenCalledWith(
        '/repositories/ws/repo/diffstat/main..feature%2Fbranch',
        expect.anything()
      );
    });

    it('should handle simple refs without extra encoding', async () => {
      await api.getDiffStat('ws', 'repo', 'main..develop');
      expect(mockClient.getPaginated).toHaveBeenCalledWith(
        '/repositories/ws/repo/diffstat/main..develop',
        expect.anything()
      );
    });
  });

  describe('getBranch - URL encoding', () => {
    it('should URL-encode branch names with slashes', async () => {
      await api.getBranch('ws', 'repo', 'feature/my-branch');
      expect(mockClient.get).toHaveBeenCalledWith(
        '/repositories/ws/repo/refs/branches/feature%2Fmy-branch'
      );
    });
  });

  describe('deleteBranch - URL encoding', () => {
    it('should URL-encode branch names with slashes', async () => {
      await api.deleteBranch('ws', 'repo', 'feature/old-branch');
      expect(mockClient.delete).toHaveBeenCalledWith(
        '/repositories/ws/repo/refs/branches/feature%2Fold-branch'
      );
    });
  });

  describe('createBranch', () => {
    it('should pass name and target hash in body', async () => {
      await api.createBranch('ws', 'repo', 'feature/new', 'abc123');
      expect(mockClient.post).toHaveBeenCalledWith(
        '/repositories/ws/repo/refs/branches',
        { name: 'feature/new', target: { hash: 'abc123' } }
      );
    });
  });
});
