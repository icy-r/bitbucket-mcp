import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerBranchTools } from '../../../src/tools/branch-tools.js';
import { BitbucketClient } from '../../../src/api/client.js';
import type { Config } from '../../../src/config/settings.js';

const mockListBranches = vi.fn().mockResolvedValue({ values: [{ name: 'main' }], page: 1, pagelen: 25, size: 1 });
const mockGetBranch = vi.fn().mockResolvedValue({ name: 'main', target: { hash: 'abc123' } });
const mockCreateBranch = vi.fn().mockResolvedValue({ name: 'new-branch', target: { hash: 'abc123' } });
const mockDeleteBranch = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/api/endpoints/repositories.js', () => ({
  RepositoriesAPI: vi.fn().mockImplementation(() => ({
    listBranches: mockListBranches,
    getBranch: mockGetBranch,
    createBranch: mockCreateBranch,
    deleteBranch: mockDeleteBranch,
    listTags: vi.fn().mockResolvedValue({ values: [], page: 1, pagelen: 25, size: 0 }),
    getTag: vi.fn().mockResolvedValue({ name: 'v1.0', target: { hash: 'def456' } }),
    createTag: vi.fn().mockResolvedValue({ name: 'v1.0', target: { hash: 'def456' } }),
  })),
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

describe('Branch Tools', () => {
  let handler: (params: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[]; isError?: boolean }>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    vi.spyOn(server, 'tool').mockImplementation((...args: unknown[]) => {
      handler = args[args.length - 1] as typeof handler;
      return undefined as unknown as ReturnType<typeof server.tool>;
    });
    registerBranchTools(server, {} as BitbucketClient, baseConfig);
  });

  describe('branch_name parameter', () => {
    it('should use branch_name for get_branch action', async () => {
      const result = await handler({
        action: 'get_branch',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        branch_name: 'feature/my-feature',
      });

      expect(result.isError).toBeUndefined();
      expect(mockGetBranch).toHaveBeenCalledWith(
        'test-ws',
        'test-repo',
        'feature/my-feature'
      );
    });

    it('should require branch_name for create_branch', async () => {
      const result = await handler({
        action: 'create_branch',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        target: 'abc123',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('branch_name');
    });

    it('should create branch with branch_name and target', async () => {
      const result = await handler({
        action: 'create_branch',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        branch_name: 'release/v2.0',
        target: 'abc123def',
      });

      expect(result.isError).toBeUndefined();
      expect(mockCreateBranch).toHaveBeenCalledWith(
        'test-ws',
        'test-repo',
        'release/v2.0',
        'abc123def'
      );
    });

    it('should require branch_name for delete_branch', async () => {
      const result = await handler({
        action: 'delete_branch',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('branch_name');
    });

    it('should delete branch by branch_name', async () => {
      await handler({
        action: 'delete_branch',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        branch_name: 'old-branch',
      });

      expect(mockDeleteBranch).toHaveBeenCalledWith(
        'test-ws',
        'test-repo',
        'old-branch'
      );
    });
  });

  describe('workspace default from config', () => {
    it('should use config.workspace when workspace param is omitted', async () => {
      await handler({
        action: 'list_branches',
        repo_slug: 'test-repo',
      });

      expect(mockListBranches).toHaveBeenCalledWith(
        'default-ws',
        'test-repo',
        expect.anything()
      );
    });

    it('should return error when no workspace is available', async () => {
      const noWsConfig = { ...baseConfig, workspace: undefined };
      const server2 = new McpServer({ name: 'test2', version: '1.0.0' });
      let handler2: typeof handler;
      vi.spyOn(server2, 'tool').mockImplementation((...args: unknown[]) => {
        handler2 = args[args.length - 1] as typeof handler;
        return undefined as unknown as ReturnType<typeof server2.tool>;
      });
      registerBranchTools(server2, {} as BitbucketClient, noWsConfig);

      const result = await handler2!({
        action: 'list_branches',
        repo_slug: 'test-repo',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('workspace is required');
    });
  });
});
