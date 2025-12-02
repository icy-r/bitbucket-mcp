import type { BitbucketClient } from '../client.js';
import type {
  Pipeline,
  PipelineStep,
  PipelineVariable,
  TriggerPipelineRequest,
} from '../types/index.js';
import type { PaginatedResponse, PaginationOptions } from '../../utils/pagination.js';
import { buildPaginationParams } from '../../utils/pagination.js';

/**
 * Pipeline list options
 */
export interface ListPipelinesOptions extends PaginationOptions {
  sort?: string;
  'target.branch'?: string;
  'target.ref_name'?: string;
}

/**
 * Pipelines API endpoints
 */
export class PipelinesAPI {
  constructor(private readonly client: BitbucketClient) {}

  /**
   * List pipelines for a repository
   */
  async list(
    workspace: string,
    repoSlug: string,
    options?: ListPipelinesOptions
  ): Promise<PaginatedResponse<Pipeline>> {
    const params: Record<string, string | number | boolean | undefined> = {
      ...buildPaginationParams(options),
      sort: options?.sort,
      'target.branch': options?.['target.branch'],
      'target.ref_name': options?.['target.ref_name'],
    };
    return this.client.getPaginated<Pipeline>(
      `/repositories/${workspace}/${repoSlug}/pipelines`,
      params
    );
  }

  /**
   * Get a specific pipeline
   */
  async get(workspace: string, repoSlug: string, pipelineUuid: string): Promise<Pipeline> {
    return this.client.get<Pipeline>(
      `/repositories/${workspace}/${repoSlug}/pipelines/${pipelineUuid}`
    );
  }

  /**
   * Trigger a new pipeline
   */
  async trigger(
    workspace: string,
    repoSlug: string,
    request: TriggerPipelineRequest
  ): Promise<Pipeline> {
    return this.client.post<Pipeline>(
      `/repositories/${workspace}/${repoSlug}/pipelines`,
      request
    );
  }

  /**
   * Trigger a pipeline for a branch
   */
  async triggerBranch(
    workspace: string,
    repoSlug: string,
    branchName: string,
    variables?: Array<{ key: string; value: string; secured?: boolean }>
  ): Promise<Pipeline> {
    return this.trigger(workspace, repoSlug, {
      target: {
        type: 'pipeline_ref_target',
        ref_type: 'branch',
        ref_name: branchName,
      },
      variables,
    });
  }

  /**
   * Trigger a custom pipeline
   */
  async triggerCustom(
    workspace: string,
    repoSlug: string,
    branchName: string,
    pattern: string,
    variables?: Array<{ key: string; value: string; secured?: boolean }>
  ): Promise<Pipeline> {
    return this.trigger(workspace, repoSlug, {
      target: {
        type: 'pipeline_ref_target',
        ref_type: 'branch',
        ref_name: branchName,
        selector: {
          type: 'custom',
          pattern,
        },
      },
      variables,
    });
  }

  /**
   * Stop a running pipeline
   */
  async stop(workspace: string, repoSlug: string, pipelineUuid: string): Promise<void> {
    await this.client.post(
      `/repositories/${workspace}/${repoSlug}/pipelines/${pipelineUuid}/stopPipeline`
    );
  }

  /**
   * List pipeline steps
   */
  async listSteps(
    workspace: string,
    repoSlug: string,
    pipelineUuid: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<PipelineStep>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated<PipelineStep>(
      `/repositories/${workspace}/${repoSlug}/pipelines/${pipelineUuid}/steps`,
      params
    );
  }

  /**
   * Get a specific pipeline step
   */
  async getStep(
    workspace: string,
    repoSlug: string,
    pipelineUuid: string,
    stepUuid: string
  ): Promise<PipelineStep> {
    return this.client.get<PipelineStep>(
      `/repositories/${workspace}/${repoSlug}/pipelines/${pipelineUuid}/steps/${stepUuid}`
    );
  }

  /**
   * Get pipeline step logs
   */
  async getStepLogs(
    workspace: string,
    repoSlug: string,
    pipelineUuid: string,
    stepUuid: string
  ): Promise<string> {
    return this.client.getRaw(
      `/repositories/${workspace}/${repoSlug}/pipelines/${pipelineUuid}/steps/${stepUuid}/log`
    );
  }

  /**
   * List repository pipeline variables
   */
  async listVariables(
    workspace: string,
    repoSlug: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<PipelineVariable>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated<PipelineVariable>(
      `/repositories/${workspace}/${repoSlug}/pipelines_config/variables`,
      params
    );
  }

  /**
   * Get a specific pipeline variable
   */
  async getVariable(
    workspace: string,
    repoSlug: string,
    variableUuid: string
  ): Promise<PipelineVariable> {
    return this.client.get<PipelineVariable>(
      `/repositories/${workspace}/${repoSlug}/pipelines_config/variables/${variableUuid}`
    );
  }

  /**
   * Create a pipeline variable
   */
  async createVariable(
    workspace: string,
    repoSlug: string,
    variable: { key: string; value: string; secured?: boolean }
  ): Promise<PipelineVariable> {
    return this.client.post<PipelineVariable>(
      `/repositories/${workspace}/${repoSlug}/pipelines_config/variables`,
      variable
    );
  }

  /**
   * Update a pipeline variable
   */
  async updateVariable(
    workspace: string,
    repoSlug: string,
    variableUuid: string,
    variable: { key?: string; value?: string; secured?: boolean }
  ): Promise<PipelineVariable> {
    return this.client.put<PipelineVariable>(
      `/repositories/${workspace}/${repoSlug}/pipelines_config/variables/${variableUuid}`,
      variable
    );
  }

  /**
   * Delete a pipeline variable
   */
  async deleteVariable(
    workspace: string,
    repoSlug: string,
    variableUuid: string
  ): Promise<void> {
    await this.client.delete(
      `/repositories/${workspace}/${repoSlug}/pipelines_config/variables/${variableUuid}`
    );
  }

  /**
   * Get pipeline configuration
   */
  async getConfig(workspace: string, repoSlug: string): Promise<{ enabled: boolean }> {
    return this.client.get<{ enabled: boolean }>(
      `/repositories/${workspace}/${repoSlug}/pipelines_config`
    );
  }

  /**
   * Enable or disable pipelines
   */
  async setEnabled(workspace: string, repoSlug: string, enabled: boolean): Promise<void> {
    await this.client.put(`/repositories/${workspace}/${repoSlug}/pipelines_config`, {
      enabled,
    });
  }
}

