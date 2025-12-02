import type { BitbucketClient } from '../client.js';
import type {
  Repository,
  Branch,
  Tag,
  Commit,
  TreeEntry,
  CreateRepositoryRequest,
} from '../types/index.js';
import type { PaginatedResponse, PaginationOptions } from '../../utils/pagination.js';
import { buildPaginationParams } from '../../utils/pagination.js';

/**
 * Repository list options
 */
export interface ListRepositoriesOptions extends PaginationOptions {
  role?: 'owner' | 'admin' | 'contributor' | 'member';
  q?: string;
  sort?: string;
}

/**
 * Repository API endpoints
 */
export class RepositoriesAPI {
  constructor(private readonly client: BitbucketClient) {}

  /**
   * List repositories in a workspace
   */
  async list(
    workspace: string,
    options?: ListRepositoriesOptions
  ): Promise<PaginatedResponse<Repository>> {
    const params: Record<string, string | number | boolean | undefined> = {
      ...buildPaginationParams(options),
      role: options?.role,
      q: options?.q,
      sort: options?.sort,
    };
    return this.client.getPaginated<Repository>(`/repositories/${workspace}`, params);
  }

  /**
   * Get a specific repository
   */
  async get(workspace: string, repoSlug: string): Promise<Repository> {
    return this.client.get<Repository>(`/repositories/${workspace}/${repoSlug}`);
  }

  /**
   * Create a new repository
   */
  async create(
    workspace: string,
    repoSlug: string,
    data: CreateRepositoryRequest
  ): Promise<Repository> {
    return this.client.post<Repository>(`/repositories/${workspace}/${repoSlug}`, data);
  }

  /**
   * Update a repository
   */
  async update(
    workspace: string,
    repoSlug: string,
    data: Partial<CreateRepositoryRequest>
  ): Promise<Repository> {
    return this.client.put<Repository>(`/repositories/${workspace}/${repoSlug}`, data);
  }

  /**
   * Delete a repository
   */
  async delete(workspace: string, repoSlug: string): Promise<void> {
    await this.client.delete(`/repositories/${workspace}/${repoSlug}`);
  }

  /**
   * Fork a repository
   */
  async fork(
    workspace: string,
    repoSlug: string,
    options?: {
      name?: string;
      workspace?: { slug: string };
      is_private?: boolean;
      description?: string;
    }
  ): Promise<Repository> {
    return this.client.post<Repository>(`/repositories/${workspace}/${repoSlug}/forks`, options);
  }

  /**
   * List branches
   */
  async listBranches(
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
  async getBranch(workspace: string, repoSlug: string, branchName: string): Promise<Branch> {
    return this.client.get<Branch>(
      `/repositories/${workspace}/${repoSlug}/refs/branches/${encodeURIComponent(branchName)}`
    );
  }

  /**
   * Create a branch
   */
  async createBranch(
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
  async deleteBranch(workspace: string, repoSlug: string, branchName: string): Promise<void> {
    await this.client.delete(
      `/repositories/${workspace}/${repoSlug}/refs/branches/${encodeURIComponent(branchName)}`
    );
  }

  /**
   * List tags
   */
  async listTags(
    workspace: string,
    repoSlug: string,
    options?: PaginationOptions & { q?: string; sort?: string }
  ): Promise<PaginatedResponse<Tag>> {
    const params: Record<string, string | number | boolean | undefined> = {
      ...buildPaginationParams(options),
      q: options?.q,
      sort: options?.sort,
    };
    return this.client.getPaginated<Tag>(
      `/repositories/${workspace}/${repoSlug}/refs/tags`,
      params
    );
  }

  /**
   * Get a specific tag
   */
  async getTag(workspace: string, repoSlug: string, tagName: string): Promise<Tag> {
    return this.client.get<Tag>(
      `/repositories/${workspace}/${repoSlug}/refs/tags/${encodeURIComponent(tagName)}`
    );
  }

  /**
   * Create a tag
   */
  async createTag(
    workspace: string,
    repoSlug: string,
    name: string,
    target: string,
    message?: string
  ): Promise<Tag> {
    return this.client.post<Tag>(`/repositories/${workspace}/${repoSlug}/refs/tags`, {
      name,
      target: {
        hash: target,
      },
      message,
    });
  }

  /**
   * List commits
   */
  async listCommits(
    workspace: string,
    repoSlug: string,
    options?: PaginationOptions & {
      revision?: string;
      path?: string;
      include?: string;
      exclude?: string;
    }
  ): Promise<PaginatedResponse<Commit>> {
    const params: Record<string, string | number | boolean | undefined> = {
      ...buildPaginationParams(options),
      revision: options?.revision,
      path: options?.path,
      include: options?.include,
      exclude: options?.exclude,
    };
    return this.client.getPaginated<Commit>(
      `/repositories/${workspace}/${repoSlug}/commits`,
      params
    );
  }

  /**
   * Get a specific commit
   */
  async getCommit(workspace: string, repoSlug: string, commitHash: string): Promise<Commit> {
    return this.client.get<Commit>(`/repositories/${workspace}/${repoSlug}/commit/${commitHash}`);
  }

  /**
   * Get diff between two refs
   */
  async getDiff(workspace: string, repoSlug: string, spec: string): Promise<string> {
    return this.client.getRaw(`/repositories/${workspace}/${repoSlug}/diff/${spec}`);
  }

  /**
   * Get diffstat between two refs
   */
  async getDiffStat(
    workspace: string,
    repoSlug: string,
    spec: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<{ status: string; lines_added: number; lines_removed: number; old?: { path: string }; new?: { path: string } }>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated(
      `/repositories/${workspace}/${repoSlug}/diffstat/${spec}`,
      params
    );
  }

  /**
   * Browse source files
   */
  async listSource(
    workspace: string,
    repoSlug: string,
    ref: string,
    path?: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<TreeEntry>> {
    const params = buildPaginationParams(options);
    const endpoint = path
      ? `/repositories/${workspace}/${repoSlug}/src/${ref}/${path}`
      : `/repositories/${workspace}/${repoSlug}/src/${ref}`;
    return this.client.getPaginated<TreeEntry>(endpoint, params);
  }

  /**
   * Get file content
   */
  async getFileContent(
    workspace: string,
    repoSlug: string,
    ref: string,
    path: string
  ): Promise<string> {
    return this.client.getRaw(`/repositories/${workspace}/${repoSlug}/src/${ref}/${path}`);
  }
}

