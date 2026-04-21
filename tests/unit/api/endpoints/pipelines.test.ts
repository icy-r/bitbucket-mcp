import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PipelinesAPI } from '../../../../src/api/endpoints/pipelines.js';
import { BitbucketClient } from '../../../../src/api/client.js';

describe('PipelinesAPI', () => {
  let mockClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getRaw: ReturnType<typeof vi.fn>;
    getPaginated: ReturnType<typeof vi.fn>;
  };
  let api: PipelinesAPI;

  beforeEach(() => {
    mockClient = {
      get: vi.fn().mockResolvedValue({}),
      post: vi.fn().mockResolvedValue({}),
      put: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
      getRaw: vi.fn().mockResolvedValue(''),
      getPaginated: vi.fn().mockResolvedValue({ values: [], page: 1, pagelen: 25, size: 0 }),
    };
    api = new PipelinesAPI(mockClient as unknown as BitbucketClient);
  });

  describe('stop', () => {
    it('should use snake_case stop_pipeline endpoint', async () => {
      await api.stop('ws', 'repo', '{pipeline-uuid}');
      expect(mockClient.post).toHaveBeenCalledWith(
        '/repositories/ws/repo/pipelines/{pipeline-uuid}/stop_pipeline'
      );
    });

    it('should NOT use camelCase stopPipeline endpoint', async () => {
      await api.stop('ws', 'repo', '{pipeline-uuid}');
      const calledUrl = mockClient.post.mock.calls[0][0];
      expect(calledUrl).not.toContain('stopPipeline');
    });
  });

  describe('triggerBranch', () => {
    it('should pass branch name as ref_name in target', async () => {
      await api.triggerBranch('ws', 'repo', 'feature/my-branch');
      expect(mockClient.post).toHaveBeenCalledWith(
        '/repositories/ws/repo/pipelines',
        expect.objectContaining({
          target: expect.objectContaining({
            type: 'pipeline_ref_target',
            ref_type: 'branch',
            ref_name: 'feature/my-branch',
          }),
        })
      );
    });

    it('should pass variables when provided', async () => {
      const variables = [{ key: 'ENV', value: 'staging', secured: false }];
      await api.triggerBranch('ws', 'repo', 'main', variables);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/repositories/ws/repo/pipelines',
        expect.objectContaining({ variables })
      );
    });
  });

  describe('triggerCustom', () => {
    it('should include selector with custom pattern', async () => {
      await api.triggerCustom('ws', 'repo', 'main', 'deploy-prod');
      expect(mockClient.post).toHaveBeenCalledWith(
        '/repositories/ws/repo/pipelines',
        expect.objectContaining({
          target: expect.objectContaining({
            ref_name: 'main',
            selector: { type: 'custom', pattern: 'deploy-prod' },
          }),
        })
      );
    });
  });
});
