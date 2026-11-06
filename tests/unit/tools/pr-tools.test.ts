import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPullRequestTools } from '../../../src/tools/pr-tools.js';
import { BitbucketClient } from '../../../src/api/client.js';
import type { Config } from '../../../src/config/settings.js';

const mockList = vi.fn().mockResolvedValue({ values: [], page: 1, pagelen: 25, size: 0 });
const mockCreate = vi.fn().mockResolvedValue({ id: 2, title: 'Test PR', state: 'OPEN' });
const mockCreateComment = vi.fn().mockResolvedValue({ id: 10, content: { raw: 'test' } });
const mockUpdateComment = vi.fn().mockResolvedValue({ id: 10, content: { raw: 'edited' } });
const mockDeleteComment = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/api/endpoints/pull-requests.js', () => ({
  PullRequestsAPI: vi.fn().mockImplementation(() => ({
    list: mockList,
    get: vi.fn().mockResolvedValue({ id: 1, title: 'Test PR', state: 'OPEN' }),
    create: mockCreate,
    update: vi.fn().mockResolvedValue({ id: 1 }),
    merge: vi.fn().mockResolvedValue({ id: 1, state: 'MERGED' }),
    approve: vi.fn().mockResolvedValue({ approved: true }),
    unapprove: vi.fn().mockResolvedValue(undefined),
    decline: vi.fn().mockResolvedValue({ id: 1, state: 'DECLINED' }),
    listComments: vi.fn().mockResolvedValue({ values: [], page: 1, pagelen: 25, size: 0 }),
    createComment: mockCreateComment,
    updateComment: mockUpdateComment,
    deleteComment: mockDeleteComment,
    getDiff: vi.fn().mockResolvedValue('diff output'),
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

describe('Pull Request Tools', () => {
  let handler: (params: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[]; isError?: boolean }>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    vi.spyOn(server, 'tool').mockImplementation((...args: unknown[]) => {
      handler = args[args.length - 1] as typeof handler;
      return undefined as unknown as ReturnType<typeof server.tool>;
    });
    registerPullRequestTools(server, {} as BitbucketClient, baseConfig);
  });

  describe('inline comment validation', () => {
    it('should return error when inline_path is provided without inline_line', async () => {
      const result = await handler({
        action: 'add_comment',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        pr_id: 1,
        content: 'my comment',
        inline_path: 'src/main.ts',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('both inline_path and inline_line are required');
    });

    it('should return error when inline_line is provided without inline_path', async () => {
      const result = await handler({
        action: 'add_comment',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        pr_id: 1,
        content: 'my comment',
        inline_line: 42,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('both inline_path and inline_line are required');
    });

    it('should succeed when both inline_path and inline_line are provided', async () => {
      const result = await handler({
        action: 'add_comment',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        pr_id: 1,
        content: 'inline comment',
        inline_path: 'src/main.ts',
        inline_line: 42,
      });

      expect(result.isError).toBeUndefined();
      expect(mockCreateComment).toHaveBeenCalledWith(
        'test-ws',
        'test-repo',
        1,
        expect.objectContaining({
          content: { raw: 'inline comment' },
          inline: { path: 'src/main.ts', to: 42 },
        })
      );
    });

    it('should succeed for non-inline comment without inline params', async () => {
      const result = await handler({
        action: 'add_comment',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        pr_id: 1,
        content: 'regular comment',
      });

      expect(result.isError).toBeUndefined();
    });
  });

  describe('comment edit and delete', () => {
    it('should update the comment content', async () => {
      const result = await handler({
        action: 'update_comment',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        pr_id: 1,
        comment_id: 10,
        content: 'edited',
      });

      expect(result.isError).toBeUndefined();
      expect(mockUpdateComment).toHaveBeenCalledWith('test-ws', 'test-repo', 1, 10, 'edited');
    });

    it('should delete the comment', async () => {
      const result = await handler({
        action: 'delete_comment',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        pr_id: 1,
        comment_id: 10,
      });

      expect(result.isError).toBeUndefined();
      expect(mockDeleteComment).toHaveBeenCalledWith('test-ws', 'test-repo', 1, 10);
    });

    it('should return error when update_comment has no content', async () => {
      const result = await handler({
        action: 'update_comment',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        pr_id: 1,
        comment_id: 10,
      });

      expect(result.isError).toBe(true);
      expect(mockUpdateComment).not.toHaveBeenCalled();
    });

    it('should return error when delete_comment has no comment_id', async () => {
      const result = await handler({
        action: 'delete_comment',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        pr_id: 1,
      });

      expect(result.isError).toBe(true);
      expect(mockDeleteComment).not.toHaveBeenCalled();
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
  });

  describe('branch parameter naming', () => {
    it('should accept source_branch and destination_branch for create', async () => {
      const result = await handler({
        action: 'create',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        title: 'My PR',
        source_branch: 'feature/branch',
        destination_branch: 'main',
      });

      expect(result.isError).toBeUndefined();
      expect(mockCreate).toHaveBeenCalledWith(
        'test-ws',
        'test-repo',
        expect.objectContaining({
          source: { branch: { name: 'feature/branch' } },
          destination: { branch: { name: 'main' } },
        })
      );
    });
  });
});
