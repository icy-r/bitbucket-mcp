import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerIssueTools } from '../../../src/tools/issue-tools.js';
import { BitbucketClient } from '../../../src/api/client.js';
import type { Config } from '../../../src/config/settings.js';

// Shared mock functions accessible from tests
const mockList = vi.fn().mockResolvedValue({ values: [], page: 1, pagelen: 25, size: 0 });
const mockGet = vi.fn().mockResolvedValue({ id: 1, title: 'Test Issue', state: 'new' });
const mockCreate = vi.fn().mockImplementation((_ws: string, _repo: string, data: Record<string, unknown>) =>
  Promise.resolve({ id: 2, title: data.title, state: 'new', assignee: data.assignee })
);
const mockUpdate = vi.fn().mockImplementation((_ws: string, _repo: string, _id: number, data: Record<string, unknown>) =>
  Promise.resolve({ id: 1, title: 'Updated', ...data })
);

vi.mock('../../../src/api/endpoints/issues.js', () => ({
  IssuesAPI: vi.fn().mockImplementation(() => ({
    list: mockList,
    get: mockGet,
    create: mockCreate,
    update: mockUpdate,
    delete: vi.fn().mockResolvedValue(undefined),
    listComments: vi.fn().mockResolvedValue({ values: [], page: 1, pagelen: 25, size: 0 }),
    createComment: vi.fn().mockResolvedValue({ id: 1, content: { raw: 'test' } }),
    vote: vi.fn().mockResolvedValue(undefined),
    unvote: vi.fn().mockResolvedValue(undefined),
    watch: vi.fn().mockResolvedValue(undefined),
    unwatch: vi.fn().mockResolvedValue(undefined),
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

describe('Issue Tools', () => {
  let handler: (params: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[]; isError?: boolean }>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    vi.spyOn(server, 'tool').mockImplementation((...args: unknown[]) => {
      handler = args[args.length - 1] as typeof handler;
      return undefined as unknown as ReturnType<typeof server.tool>;
    });
    registerIssueTools(server, {} as BitbucketClient, baseConfig);
  });

  describe('assignee field consistency', () => {
    it('should use uuid format for create action assignee', async () => {
      const result = await handler({
        action: 'create',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        title: 'Test Issue',
        assignee: '{user-uuid-123}',
      });

      expect(result.isError).toBeUndefined();
      expect(mockCreate).toHaveBeenCalledWith(
        'test-ws',
        'test-repo',
        expect.objectContaining({
          assignee: { uuid: '{user-uuid-123}' },
        })
      );
    });

    it('should use uuid format for update action assignee (not username)', async () => {
      const result = await handler({
        action: 'update',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        issue_id: 1,
        assignee: '{user-uuid-456}',
      });

      expect(result.isError).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith(
        'test-ws',
        'test-repo',
        1,
        expect.objectContaining({
          assignee: { uuid: '{user-uuid-456}' },
        })
      );
    });

    it('should NOT use username format for update assignee', async () => {
      await handler({
        action: 'update',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        issue_id: 1,
        assignee: '{user-uuid}',
      });

      const calledData = mockUpdate.mock.calls[0][3];
      expect(calledData.assignee).not.toHaveProperty('username');
      expect(calledData.assignee).toHaveProperty('uuid');
    });
  });

  describe('workspace default from config', () => {
    it('should use config.workspace when workspace param is omitted', async () => {
      await handler({
        action: 'list',
        repo_slug: 'test-repo',
      });

      expect(mockList).toHaveBeenCalledWith(
        'default-ws',
        'test-repo',
        expect.anything()
      );
    });

    it('should prefer explicit workspace over config default', async () => {
      await handler({
        action: 'list',
        workspace: 'explicit-ws',
        repo_slug: 'test-repo',
      });

      expect(mockList).toHaveBeenCalledWith(
        'explicit-ws',
        'test-repo',
        expect.anything()
      );
    });

    it('should return error when no workspace available', async () => {
      const noWsConfig = { ...baseConfig, workspace: undefined };
      const server2 = new McpServer({ name: 'test2', version: '1.0.0' });
      let handler2: typeof handler;
      vi.spyOn(server2, 'tool').mockImplementation((...args: unknown[]) => {
        handler2 = args[args.length - 1] as typeof handler;
        return undefined as unknown as ReturnType<typeof server2.tool>;
      });
      registerIssueTools(server2, {} as BitbucketClient, noWsConfig);

      const result = await handler2!({
        action: 'list',
        repo_slug: 'test-repo',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('workspace is required');
    });
  });
});
