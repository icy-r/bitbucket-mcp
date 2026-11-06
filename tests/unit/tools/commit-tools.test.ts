import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerCommitTools } from '../../../src/tools/commit-tools.js';
import { BitbucketClient } from '../../../src/api/client.js';
import type { Config } from '../../../src/config/settings.js';

const mockListBuildStatuses = vi.fn().mockResolvedValue({
  values: [
    {
      type: 'build',
      key: 'jenkins-tests',
      name: 'Tests',
      state: 'FAILED',
      url: 'https://ci.example/job/1',
      created_on: '2026-11-06T10:00:00Z',
      updated_on: '2026-11-06T10:30:00Z',
      links: { self: { href: 'https://api.example/statuses/1' } },
    },
  ],
  page: 1,
  pagelen: 25,
  size: 1,
});

vi.mock('../../../src/api/endpoints/commits.js', () => ({
  CommitsAPI: vi.fn().mockImplementation(() => ({
    listBuildStatuses: mockListBuildStatuses,
  })),
}));

vi.mock('../../../src/api/endpoints/repositories.js', () => ({
  RepositoriesAPI: vi.fn().mockImplementation(() => ({})),
}));

const baseConfig: Config = {
  authMethod: 'api_token',
  baseUrl: 'https://api.bitbucket.org/2.0',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  logLevel: 'error',
  outputFormat: 'json',
  workspace: 'default-ws',
};

describe('Commit Tools', () => {
  let handler: (params: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[]; isError?: boolean }>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    vi.spyOn(server, 'tool').mockImplementation((...args: unknown[]) => {
      handler = args[args.length - 1] as typeof handler;
      return undefined as unknown as ReturnType<typeof server.tool>;
    });
    registerCommitTools(server, {} as BitbucketClient, baseConfig);
  });

  describe('list_statuses', () => {
    it('should list the build statuses of a commit', async () => {
      const result = await handler({
        action: 'list_statuses',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        commit_hash: 'abc123',
        pagelen: 50,
      });

      expect(result.isError).toBeUndefined();
      expect(mockListBuildStatuses).toHaveBeenCalledWith('test-ws', 'test-repo', 'abc123', {
        page: undefined,
        pagelen: 50,
      });
      expect(result.content[0].text).toContain('FAILED');
    });

    it('should keep only the essential fields in compact format', async () => {
      const result = await handler({
        action: 'list_statuses',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        commit_hash: 'abc123',
        format: 'compact',
      });

      expect(result.content[0].text).toContain('jenkins-tests');
      expect(result.content[0].text).not.toContain('api.example');
    });

    it('should return error when commit_hash is missing', async () => {
      const result = await handler({
        action: 'list_statuses',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('commit_hash is required for list_statuses');
      expect(mockListBuildStatuses).not.toHaveBeenCalled();
    });
  });
});
