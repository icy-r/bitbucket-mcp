import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerWebhookTools } from '../../../src/tools/webhook-tools.js';
import { BitbucketClient } from '../../../src/api/client.js';
import type { Config } from '../../../src/config/settings.js';

const mockList = vi.fn().mockResolvedValue({ values: [], page: 1, pagelen: 25, size: 0 });
const mockCreate = vi.fn().mockResolvedValue({ uuid: '{new-wh}' });
const mockUpdate = vi.fn().mockResolvedValue({ uuid: '{wh-uuid}' });
const mockCreateWorkspace = vi.fn().mockResolvedValue({ uuid: '{new-ws-wh}' });

vi.mock('../../../src/api/endpoints/webhooks.js', () => ({
  WebhooksAPI: vi.fn().mockImplementation(() => ({
    list: mockList,
    get: vi.fn().mockResolvedValue({ uuid: '{wh-uuid}' }),
    create: mockCreate,
    update: mockUpdate,
    delete: vi.fn().mockResolvedValue(undefined),
    listWorkspaceWebhooks: vi.fn().mockResolvedValue({ values: [], page: 1, pagelen: 25, size: 0 }),
    getWorkspaceWebhook: vi.fn().mockResolvedValue({ uuid: '{ws-wh-uuid}' }),
    createWorkspaceWebhook: mockCreateWorkspace,
    updateWorkspaceWebhook: vi.fn().mockResolvedValue({ uuid: '{ws-wh-uuid}' }),
    deleteWorkspaceWebhook: vi.fn().mockResolvedValue(undefined),
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

describe('Webhook Tools', () => {
  let handler: (params: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[]; isError?: boolean }>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    vi.spyOn(server, 'tool').mockImplementation((...args: unknown[]) => {
      handler = args[args.length - 1] as typeof handler;
      return undefined as unknown as ReturnType<typeof server.tool>;
    });
    registerWebhookTools(server, {} as BitbucketClient, baseConfig);
  });

  describe('secret parameter pass-through', () => {
    it('should pass secret when creating a repo webhook', async () => {
      const result = await handler({
        action: 'create',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        url: 'https://example.com/hook',
        events: ['repo:push'],
        secret: 'my-secret-key',
      });

      expect(result.isError).toBeUndefined();
      expect(mockCreate).toHaveBeenCalledWith(
        'test-ws',
        'test-repo',
        expect.objectContaining({
          url: 'https://example.com/hook',
          secret: 'my-secret-key',
        })
      );
    });

    it('should pass secret when creating a workspace webhook', async () => {
      const result = await handler({
        action: 'create_workspace',
        workspace: 'test-ws',
        url: 'https://example.com/ws-hook',
        events: ['repo:push'],
        secret: 'ws-secret',
      });

      expect(result.isError).toBeUndefined();
      expect(mockCreateWorkspace).toHaveBeenCalledWith(
        'test-ws',
        expect.objectContaining({
          url: 'https://example.com/ws-hook',
          secret: 'ws-secret',
        })
      );
    });

    it('should pass secret when updating a repo webhook', async () => {
      const result = await handler({
        action: 'update',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        webhook_uuid: '{wh-uuid}',
        secret: 'updated-secret',
      });

      expect(result.isError).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith(
        'test-ws',
        'test-repo',
        '{wh-uuid}',
        expect.objectContaining({
          secret: 'updated-secret',
        })
      );
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
});
