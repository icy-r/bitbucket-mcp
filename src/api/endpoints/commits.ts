import type { BitbucketClient } from '../client.js';
import type { Commit } from '../types/index.js';
import type { PaginatedResponse, PaginationOptions } from '../../utils/pagination.js';
import { buildPaginationParams } from '../../utils/pagination.js';

/**
 * Commit comment schema
 */
export interface CommitComment {
  id: number;
  content: {
    raw: string;
    markup?: string;
    html?: string;
  };
  user: {
    display_name: string;
    uuid: string;
  };
  created_on: string;
  updated_on: string;
  deleted: boolean;
  inline?: {
    path: string;
    from?: number | null;
    to?: number | null;
  };
}

/**
 * Build status schema
 */
export interface BuildStatus {
  type: 'build';
  key: string;
  name: string;
  state: 'SUCCESSFUL' | 'FAILED' | 'INPROGRESS' | 'STOPPED';
  url: string;
  description?: string;
  created_on: string;
  updated_on: string;
  refname?: string;
}

/**
 * Commits API endpoints
 */
export class CommitsAPI {
  constructor(private readonly client: BitbucketClient) {}

  /**
   * List commits in a repository
   */
  async list(
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
  async get(workspace: string, repoSlug: string, commitHash: string): Promise<Commit> {
    return this.client.get<Commit>(`/repositories/${workspace}/${repoSlug}/commit/${commitHash}`);
  }

  /**
   * Get commit diff
   */
  async getDiff(workspace: string, repoSlug: string, commitHash: string): Promise<string> {
    return this.client.getRaw(`/repositories/${workspace}/${repoSlug}/diff/${commitHash}`);
  }

  /**
   * Get commit patch
   */
  async getPatch(workspace: string, repoSlug: string, commitHash: string): Promise<string> {
    return this.client.getRaw(`/repositories/${workspace}/${repoSlug}/patch/${commitHash}`);
  }

  /**
   * List commit comments
   */
  async listComments(
    workspace: string,
    repoSlug: string,
    commitHash: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<CommitComment>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated<CommitComment>(
      `/repositories/${workspace}/${repoSlug}/commit/${commitHash}/comments`,
      params
    );
  }

  /**
   * Create a commit comment
   */
  async createComment(
    workspace: string,
    repoSlug: string,
    commitHash: string,
    content: string,
    inline?: { path: string; line: number }
  ): Promise<CommitComment> {
    const body: { content: { raw: string }; inline?: { path: string; to: number } } = {
      content: { raw: content },
    };
    if (inline) {
      body.inline = { path: inline.path, to: inline.line };
    }
    return this.client.post<CommitComment>(
      `/repositories/${workspace}/${repoSlug}/commit/${commitHash}/comments`,
      body
    );
  }

  /**
   * Get build statuses for a commit
   */
  async listBuildStatuses(
    workspace: string,
    repoSlug: string,
    commitHash: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<BuildStatus>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated<BuildStatus>(
      `/repositories/${workspace}/${repoSlug}/commit/${commitHash}/statuses`,
      params
    );
  }

  /**
   * Create a build status for a commit
   */
  async createBuildStatus(
    workspace: string,
    repoSlug: string,
    commitHash: string,
    status: {
      key: string;
      state: 'SUCCESSFUL' | 'FAILED' | 'INPROGRESS' | 'STOPPED';
      url: string;
      name?: string;
      description?: string;
    }
  ): Promise<BuildStatus> {
    return this.client.post<BuildStatus>(
      `/repositories/${workspace}/${repoSlug}/commit/${commitHash}/statuses/build`,
      status
    );
  }

  /**
   * Compare two commits/branches/tags
   */
  async compare(
    workspace: string,
    repoSlug: string,
    base: string,
    head: string
  ): Promise<{ commits: Commit[] }> {
    // spec would be used for direct API call: `${base}..${head}`
    const response = await this.client.getPaginated<Commit>(
      `/repositories/${workspace}/${repoSlug}/commits`,
      { include: head, exclude: base }
    );
    return { commits: response.values };
  }
}
