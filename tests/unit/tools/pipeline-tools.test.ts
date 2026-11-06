import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPipelineTools } from '../../../src/tools/pipeline-tools.js';
import { BitbucketClient } from '../../../src/api/client.js';
import type { Config } from '../../../src/config/settings.js';

const mockList = vi.fn().mockResolvedValue({ values: [], page: 1, pagelen: 25, size: 0 });
const mockTriggerBranch = vi.fn().mockResolvedValue({ uuid: '{new-pipeline}' });
const mockTriggerCustom = vi.fn().mockResolvedValue({ uuid: '{custom-pipeline}' });

vi.mock('../../../src/api/endpoints/pipelines.js', () => ({
  PipelinesAPI: vi.fn().mockImplementation(() => ({
    list: mockList,
    get: vi.fn().mockResolvedValue({
      uuid: '{pipeline-uuid}',
      target: {
        ref_name: 'feature/x',
        commit: { hash: 'abc123def456', links: { html: { href: 'https://example' } } },
        pullrequest: { id: 42, title: 'PR title' },
      },
    }),
    triggerBranch: mockTriggerBranch,
    triggerCustom: mockTriggerCustom,
    stop: vi.fn().mockResolvedValue(undefined),
    listSteps: vi.fn().mockResolvedValue({ values: [], page: 1, pagelen: 25, size: 0 }),
    getStep: vi.fn().mockResolvedValue({ uuid: '{step-uuid}' }),
    getStepLogs: vi.fn().mockResolvedValue('log output'),
    getConfig: vi.fn().mockResolvedValue({ enabled: true }),
    setEnabled: vi.fn().mockResolvedValue(undefined),
    listVariables: vi.fn().mockResolvedValue({ values: [], page: 1, pagelen: 25, size: 0 }),
    getVariable: vi.fn().mockResolvedValue({ uuid: '{var-uuid}' }),
    createVariable: vi.fn().mockResolvedValue({ uuid: '{new-var}' }),
    updateVariable: vi.fn().mockResolvedValue({ uuid: '{var-uuid}' }),
    deleteVariable: vi.fn().mockResolvedValue(undefined),
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

describe('Pipeline Tools', () => {
  let handler: (params: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[]; isError?: boolean }>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    vi.spyOn(server, 'tool').mockImplementation((...args: unknown[]) => {
      handler = args[args.length - 1] as typeof handler;
      return undefined as unknown as ReturnType<typeof server.tool>;
    });
    registerPipelineTools(server, {} as BitbucketClient, baseConfig);
  });

  describe('branch_name parameter (renamed from branch)', () => {
    it('should use branch_name for trigger action', async () => {
      const result = await handler({
        action: 'trigger',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        branch_name: 'feature/my-branch',
      });

      expect(result.isError).toBeUndefined();
      expect(mockTriggerBranch).toHaveBeenCalledWith(
        'test-ws',
        'test-repo',
        'feature/my-branch',
        undefined
      );
    });

    it('should use branch_name for trigger_custom action', async () => {
      const result = await handler({
        action: 'trigger_custom',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        branch_name: 'main',
        pattern: 'deploy-staging',
      });

      expect(result.isError).toBeUndefined();
      expect(mockTriggerCustom).toHaveBeenCalledWith(
        'test-ws',
        'test-repo',
        'main',
        'deploy-staging',
        undefined
      );
    });

    it('should return error when branch_name is missing for trigger', async () => {
      const result = await handler({
        action: 'trigger',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('branch_name is required');
    });

    it('should return error when branch_name is missing for trigger_custom', async () => {
      const result = await handler({
        action: 'trigger_custom',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        pattern: 'deploy',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('branch_name');
    });
  });

  describe('compact output', () => {
    it('should include the target commit hash and pull request id', async () => {
      const result = await handler({
        action: 'get',
        workspace: 'test-ws',
        repo_slug: 'test-repo',
        pipeline_uuid: '{pipeline-uuid}',
        format: 'compact',
      });

      expect(result.content[0].text).toContain('abc123def456');
      expect(result.content[0].text).toContain('42');
      expect(result.content[0].text).not.toContain('PR title');
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
