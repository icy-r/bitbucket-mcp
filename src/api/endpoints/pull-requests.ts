import type { BitbucketClient } from '../client.js';
import type {
  PullRequest,
  PullRequestComment,
  PullRequestState,
  CreatePullRequestRequest,
  MergePullRequestRequest,
  CreateCommentRequest,
  DiffStat,
} from '../types/index.js';
import type { PaginatedResponse, PaginationOptions } from '../../utils/pagination.js';
import { buildPaginationParams } from '../../utils/pagination.js';

/**
 * Pull request list options
 */
export interface ListPullRequestsOptions extends PaginationOptions {
  state?: PullRequestState | 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  q?: string;
  sort?: string;
}

/**
 * Pull Request API endpoints
 */
export class PullRequestsAPI {
  constructor(private readonly client: BitbucketClient) {}

  /**
   * List pull requests for a repository
   */
  async list(
    workspace: string,
    repoSlug: string,
    options?: ListPullRequestsOptions
  ): Promise<PaginatedResponse<PullRequest>> {
    const params: Record<string, string | number | boolean | undefined> = {
      ...buildPaginationParams(options),
      state: options?.state,
      q: options?.q,
      sort: options?.sort,
    };
    return this.client.getPaginated<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests`,
      params
    );
  }

  /**
   * Get a specific pull request
   */
  async get(workspace: string, repoSlug: string, prId: number): Promise<PullRequest> {
    return this.client.get<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}`
    );
  }

  /**
   * Create a pull request
   */
  async create(
    workspace: string,
    repoSlug: string,
    data: CreatePullRequestRequest
  ): Promise<PullRequest> {
    return this.client.post<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests`,
      data
    );
  }

  /**
   * Update a pull request
   */
  async update(
    workspace: string,
    repoSlug: string,
    prId: number,
    data: Partial<CreatePullRequestRequest>
  ): Promise<PullRequest> {
    return this.client.put<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}`,
      data
    );
  }

  /**
   * Merge a pull request
   */
  async merge(
    workspace: string,
    repoSlug: string,
    prId: number,
    options?: MergePullRequestRequest
  ): Promise<PullRequest> {
    return this.client.post<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/merge`,
      options
    );
  }

  /**
   * Decline a pull request
   */
  async decline(workspace: string, repoSlug: string, prId: number): Promise<PullRequest> {
    return this.client.post<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/decline`
    );
  }

  /**
   * Approve a pull request
   */
  async approve(workspace: string, repoSlug: string, prId: number): Promise<{ approved: boolean }> {
    return this.client.post<{ approved: boolean }>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/approve`
    );
  }

  /**
   * Unapprove a pull request
   */
  async unapprove(workspace: string, repoSlug: string, prId: number): Promise<void> {
    await this.client.delete(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/approve`
    );
  }

  /**
   * Request changes on a pull request
   */
  async requestChanges(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<{ approved: boolean }> {
    return this.client.post<{ approved: boolean }>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/request-changes`
    );
  }

  /**
   * Get pull request diff
   */
  async getDiff(workspace: string, repoSlug: string, prId: number): Promise<string> {
    return this.client.getRaw(`/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/diff`);
  }

  /**
   * Get pull request diffstat
   */
  async getDiffStat(
    workspace: string,
    repoSlug: string,
    prId: number,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<DiffStat>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated<DiffStat>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/diffstat`,
      params
    );
  }

  /**
   * List pull request commits
   */
  async listCommits(
    workspace: string,
    repoSlug: string,
    prId: number,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<{ hash: string; message: string; date: string }>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/commits`,
      params
    );
  }

  /**
   * List comments on a pull request
   */
  async listComments(
    workspace: string,
    repoSlug: string,
    prId: number,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<PullRequestComment>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated<PullRequestComment>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments`,
      params
    );
  }

  /**
   * Get a specific comment
   */
  async getComment(
    workspace: string,
    repoSlug: string,
    prId: number,
    commentId: number
  ): Promise<PullRequestComment> {
    return this.client.get<PullRequestComment>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments/${commentId}`
    );
  }

  /**
   * Create a comment on a pull request
   */
  async createComment(
    workspace: string,
    repoSlug: string,
    prId: number,
    data: CreateCommentRequest
  ): Promise<PullRequestComment> {
    return this.client.post<PullRequestComment>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments`,
      data
    );
  }

  /**
   * Update a comment
   */
  async updateComment(
    workspace: string,
    repoSlug: string,
    prId: number,
    commentId: number,
    content: string
  ): Promise<PullRequestComment> {
    return this.client.put<PullRequestComment>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments/${commentId}`,
      { content: { raw: content } }
    );
  }

  /**
   * Delete a comment
   */
  async deleteComment(
    workspace: string,
    repoSlug: string,
    prId: number,
    commentId: number
  ): Promise<void> {
    await this.client.delete(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments/${commentId}`
    );
  }

  /**
   * Get pull request activity
   */
  async getActivity(
    workspace: string,
    repoSlug: string,
    prId: number,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<{ update?: unknown; approval?: unknown; comment?: unknown }>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/activity`,
      params
    );
  }
}

