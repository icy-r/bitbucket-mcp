import type { BitbucketClient } from '../client.js';
import type { Workspace, Project } from '../types/index.js';
import type { PaginatedResponse, PaginationOptions } from '../../utils/pagination.js';
import { buildPaginationParams } from '../../utils/pagination.js';

/**
 * Workspace API endpoints
 */
export class WorkspacesAPI {
  constructor(private readonly client: BitbucketClient) {}

  /**
   * List workspaces accessible to the current user
   */
  async list(options?: PaginationOptions): Promise<PaginatedResponse<Workspace>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated<Workspace>('/workspaces', params);
  }

  /**
   * Get a specific workspace
   */
  async get(workspace: string): Promise<Workspace> {
    return this.client.get<Workspace>(`/workspaces/${workspace}`);
  }

  /**
   * List projects in a workspace
   */
  async listProjects(
    workspace: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<Project>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated<Project>(`/workspaces/${workspace}/projects`, params);
  }

  /**
   * Get a specific project
   */
  async getProject(workspace: string, projectKey: string): Promise<Project> {
    return this.client.get<Project>(`/workspaces/${workspace}/projects/${projectKey}`);
  }

  /**
   * Get workspace members
   */
  async listMembers(
    workspace: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<{ user: { display_name: string; uuid: string } }>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated(`/workspaces/${workspace}/members`, params);
  }
}

