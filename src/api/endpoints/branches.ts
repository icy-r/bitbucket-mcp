import type { BitbucketClient } from '../client.js';
import type { Branch } from '../types/index.js';
import type { PaginatedResponse, PaginationOptions } from '../../utils/pagination.js';
import { buildPaginationParams } from '../../utils/pagination.js';

/**
 * Branch restriction schema
 */
export interface BranchRestriction {
  id: number;
  type: string;
  kind: string;
  pattern: string;
  value?: number;
  users?: Array<{ display_name: string; uuid: string }>;
  groups?: Array<{ name: string; slug: string }>;
  branch_match_kind: 'branching_model' | 'glob';
  branch_type?: string;
}

/**
 * Branching model schema
 */
export interface BranchingModel {
  type: 'branching_model';
  development?: {
    name: string;
    branch?: {
      type: 'branch';
      name: string;
    };
    use_mainbranch: boolean;
  };
  production?: {
    name: string;
    branch?: {
      type: 'branch';
      name: string;
    };
    use_mainbranch: boolean;
    enabled: boolean;
  };
  branch_types?: Array<{
    kind: 'feature' | 'bugfix' | 'release' | 'hotfix';
    prefix: string;
    enabled: boolean;
  }>;
}

/**
 * Branches API endpoints
 */
export class BranchesAPI {
  constructor(private readonly client: BitbucketClient) {}

  /**
   * List branches in a repository
   */
  async list(
    workspace: string,
    repoSlug: string,
    options?: PaginationOptions & { q?: string; sort?: string }
  ): Promise<PaginatedResponse<Branch>> {
    const params: Record<string, string | number | boolean | undefined> = {
      ...buildPaginationParams(options),
      q: options?.q,
      sort: options?.sort,
    };
    return this.client.getPaginated<Branch>(
      `/repositories/${workspace}/${repoSlug}/refs/branches`,
      params
    );
  }

  /**
   * Get a specific branch
   */
  async get(workspace: string, repoSlug: string, branchName: string): Promise<Branch> {
    return this.client.get<Branch>(
      `/repositories/${workspace}/${repoSlug}/refs/branches/${encodeURIComponent(branchName)}`
    );
  }

  /**
   * Create a branch
   */
  async create(
    workspace: string,
    repoSlug: string,
    name: string,
    target: string
  ): Promise<Branch> {
    return this.client.post<Branch>(`/repositories/${workspace}/${repoSlug}/refs/branches`, {
      name,
      target: {
        hash: target,
      },
    });
  }

  /**
   * Delete a branch
   */
  async delete(workspace: string, repoSlug: string, branchName: string): Promise<void> {
    await this.client.delete(
      `/repositories/${workspace}/${repoSlug}/refs/branches/${encodeURIComponent(branchName)}`
    );
  }

  /**
   * Get the branching model for a repository
   */
  async getBranchingModel(workspace: string, repoSlug: string): Promise<BranchingModel> {
    return this.client.get<BranchingModel>(
      `/repositories/${workspace}/${repoSlug}/branching-model`
    );
  }

  /**
   * Get branching model settings
   */
  async getBranchingModelSettings(workspace: string, repoSlug: string): Promise<BranchingModel> {
    return this.client.get<BranchingModel>(
      `/repositories/${workspace}/${repoSlug}/branching-model/settings`
    );
  }

  /**
   * Update branching model settings
   */
  async updateBranchingModelSettings(
    workspace: string,
    repoSlug: string,
    settings: Partial<BranchingModel>
  ): Promise<BranchingModel> {
    return this.client.put<BranchingModel>(
      `/repositories/${workspace}/${repoSlug}/branching-model/settings`,
      settings
    );
  }

  /**
   * List branch restrictions
   */
  async listRestrictions(
    workspace: string,
    repoSlug: string,
    options?: PaginationOptions & { kind?: string; pattern?: string }
  ): Promise<PaginatedResponse<BranchRestriction>> {
    const params: Record<string, string | number | boolean | undefined> = {
      ...buildPaginationParams(options),
      kind: options?.kind,
      pattern: options?.pattern,
    };
    return this.client.getPaginated<BranchRestriction>(
      `/repositories/${workspace}/${repoSlug}/branch-restrictions`,
      params
    );
  }

  /**
   * Get a specific branch restriction
   */
  async getRestriction(
    workspace: string,
    repoSlug: string,
    restrictionId: number
  ): Promise<BranchRestriction> {
    return this.client.get<BranchRestriction>(
      `/repositories/${workspace}/${repoSlug}/branch-restrictions/${restrictionId}`
    );
  }

  /**
   * Create a branch restriction
   */
  async createRestriction(
    workspace: string,
    repoSlug: string,
    restriction: Omit<BranchRestriction, 'id'>
  ): Promise<BranchRestriction> {
    return this.client.post<BranchRestriction>(
      `/repositories/${workspace}/${repoSlug}/branch-restrictions`,
      restriction
    );
  }

  /**
   * Update a branch restriction
   */
  async updateRestriction(
    workspace: string,
    repoSlug: string,
    restrictionId: number,
    restriction: Partial<BranchRestriction>
  ): Promise<BranchRestriction> {
    return this.client.put<BranchRestriction>(
      `/repositories/${workspace}/${repoSlug}/branch-restrictions/${restrictionId}`,
      restriction
    );
  }

  /**
   * Delete a branch restriction
   */
  async deleteRestriction(
    workspace: string,
    repoSlug: string,
    restrictionId: number
  ): Promise<void> {
    await this.client.delete(
      `/repositories/${workspace}/${repoSlug}/branch-restrictions/${restrictionId}`
    );
  }
}

