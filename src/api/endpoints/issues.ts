import type { BitbucketClient } from '../client.js';
import type {
  Issue,
  IssueComment,
  CreateIssueRequest,
  UpdateIssueRequest,
  CreateIssueCommentRequest,
  IssueState,
  IssuePriority,
  IssueKind,
} from '../types/index.js';
import type { PaginatedResponse, PaginationOptions } from '../../utils/pagination.js';
import { buildPaginationParams } from '../../utils/pagination.js';

/**
 * Issue list options
 */
export interface ListIssuesOptions extends PaginationOptions {
  q?: string;
  sort?: string;
  state?: IssueState;
  priority?: IssuePriority;
  kind?: IssueKind;
  assignee?: string;
  reporter?: string;
}

/**
 * Issues API endpoints
 */
export class IssuesAPI {
  constructor(private readonly client: BitbucketClient) {}

  /**
   * List issues for a repository
   */
  async list(
    workspace: string,
    repoSlug: string,
    options?: ListIssuesOptions
  ): Promise<PaginatedResponse<Issue>> {
    const params: Record<string, string | number | boolean | undefined> = {
      ...buildPaginationParams(options),
      q: options?.q,
      sort: options?.sort,
      state: options?.state,
      priority: options?.priority,
      kind: options?.kind,
      assignee: options?.assignee,
      reporter: options?.reporter,
    };
    return this.client.getPaginated<Issue>(
      `/repositories/${workspace}/${repoSlug}/issues`,
      params
    );
  }

  /**
   * Get a specific issue
   */
  async get(workspace: string, repoSlug: string, issueId: number): Promise<Issue> {
    return this.client.get<Issue>(
      `/repositories/${workspace}/${repoSlug}/issues/${issueId}`
    );
  }

  /**
   * Create an issue
   */
  async create(
    workspace: string,
    repoSlug: string,
    data: CreateIssueRequest
  ): Promise<Issue> {
    return this.client.post<Issue>(
      `/repositories/${workspace}/${repoSlug}/issues`,
      data
    );
  }

  /**
   * Update an issue
   */
  async update(
    workspace: string,
    repoSlug: string,
    issueId: number,
    data: UpdateIssueRequest
  ): Promise<Issue> {
    return this.client.put<Issue>(
      `/repositories/${workspace}/${repoSlug}/issues/${issueId}`,
      data
    );
  }

  /**
   * Delete an issue
   */
  async delete(workspace: string, repoSlug: string, issueId: number): Promise<void> {
    await this.client.delete(`/repositories/${workspace}/${repoSlug}/issues/${issueId}`);
  }

  /**
   * List comments on an issue
   */
  async listComments(
    workspace: string,
    repoSlug: string,
    issueId: number,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<IssueComment>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated<IssueComment>(
      `/repositories/${workspace}/${repoSlug}/issues/${issueId}/comments`,
      params
    );
  }

  /**
   * Get a specific comment
   */
  async getComment(
    workspace: string,
    repoSlug: string,
    issueId: number,
    commentId: number
  ): Promise<IssueComment> {
    return this.client.get<IssueComment>(
      `/repositories/${workspace}/${repoSlug}/issues/${issueId}/comments/${commentId}`
    );
  }

  /**
   * Create a comment on an issue
   */
  async createComment(
    workspace: string,
    repoSlug: string,
    issueId: number,
    data: CreateIssueCommentRequest
  ): Promise<IssueComment> {
    return this.client.post<IssueComment>(
      `/repositories/${workspace}/${repoSlug}/issues/${issueId}/comments`,
      data
    );
  }

  /**
   * Update a comment
   */
  async updateComment(
    workspace: string,
    repoSlug: string,
    issueId: number,
    commentId: number,
    content: string
  ): Promise<IssueComment> {
    return this.client.put<IssueComment>(
      `/repositories/${workspace}/${repoSlug}/issues/${issueId}/comments/${commentId}`,
      { content: { raw: content } }
    );
  }

  /**
   * Delete a comment
   */
  async deleteComment(
    workspace: string,
    repoSlug: string,
    issueId: number,
    commentId: number
  ): Promise<void> {
    await this.client.delete(
      `/repositories/${workspace}/${repoSlug}/issues/${issueId}/comments/${commentId}`
    );
  }

  /**
   * Vote for an issue
   */
  async vote(workspace: string, repoSlug: string, issueId: number): Promise<void> {
    await this.client.put(`/repositories/${workspace}/${repoSlug}/issues/${issueId}/vote`);
  }

  /**
   * Remove vote from an issue
   */
  async unvote(workspace: string, repoSlug: string, issueId: number): Promise<void> {
    await this.client.delete(`/repositories/${workspace}/${repoSlug}/issues/${issueId}/vote`);
  }

  /**
   * Watch an issue
   */
  async watch(workspace: string, repoSlug: string, issueId: number): Promise<void> {
    await this.client.put(`/repositories/${workspace}/${repoSlug}/issues/${issueId}/watch`);
  }

  /**
   * Unwatch an issue
   */
  async unwatch(workspace: string, repoSlug: string, issueId: number): Promise<void> {
    await this.client.delete(`/repositories/${workspace}/${repoSlug}/issues/${issueId}/watch`);
  }

  /**
   * Get issue changes/history
   */
  async getChanges(
    workspace: string,
    repoSlug: string,
    issueId: number,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<{ changes: Record<string, unknown>; created_on: string }>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated(
      `/repositories/${workspace}/${repoSlug}/issues/${issueId}/changes`,
      params
    );
  }
}

