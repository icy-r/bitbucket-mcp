import type { BitbucketClient } from '../client.js';
import type { Webhook, CreateWebhookRequest, UpdateWebhookRequest } from '../types/index.js';
import type { PaginatedResponse, PaginationOptions } from '../../utils/pagination.js';
import { buildPaginationParams } from '../../utils/pagination.js';

/**
 * Webhooks API endpoints
 */
export class WebhooksAPI {
  constructor(private readonly client: BitbucketClient) {}

  /**
   * List webhooks for a repository
   */
  async list(
    workspace: string,
    repoSlug: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<Webhook>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated<Webhook>(
      `/repositories/${workspace}/${repoSlug}/hooks`,
      params
    );
  }

  /**
   * Get a specific webhook
   */
  async get(workspace: string, repoSlug: string, webhookUuid: string): Promise<Webhook> {
    return this.client.get<Webhook>(
      `/repositories/${workspace}/${repoSlug}/hooks/${webhookUuid}`
    );
  }

  /**
   * Create a webhook
   */
  async create(
    workspace: string,
    repoSlug: string,
    data: CreateWebhookRequest
  ): Promise<Webhook> {
    return this.client.post<Webhook>(
      `/repositories/${workspace}/${repoSlug}/hooks`,
      data
    );
  }

  /**
   * Update a webhook
   */
  async update(
    workspace: string,
    repoSlug: string,
    webhookUuid: string,
    data: UpdateWebhookRequest
  ): Promise<Webhook> {
    return this.client.put<Webhook>(
      `/repositories/${workspace}/${repoSlug}/hooks/${webhookUuid}`,
      data
    );
  }

  /**
   * Delete a webhook
   */
  async delete(workspace: string, repoSlug: string, webhookUuid: string): Promise<void> {
    await this.client.delete(`/repositories/${workspace}/${repoSlug}/hooks/${webhookUuid}`);
  }

  /**
   * List workspace webhooks
   */
  async listWorkspaceWebhooks(
    workspace: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<Webhook>> {
    const params = buildPaginationParams(options);
    return this.client.getPaginated<Webhook>(`/workspaces/${workspace}/hooks`, params);
  }

  /**
   * Get a workspace webhook
   */
  async getWorkspaceWebhook(workspace: string, webhookUuid: string): Promise<Webhook> {
    return this.client.get<Webhook>(`/workspaces/${workspace}/hooks/${webhookUuid}`);
  }

  /**
   * Create a workspace webhook
   */
  async createWorkspaceWebhook(
    workspace: string,
    data: CreateWebhookRequest
  ): Promise<Webhook> {
    return this.client.post<Webhook>(`/workspaces/${workspace}/hooks`, data);
  }

  /**
   * Update a workspace webhook
   */
  async updateWorkspaceWebhook(
    workspace: string,
    webhookUuid: string,
    data: UpdateWebhookRequest
  ): Promise<Webhook> {
    return this.client.put<Webhook>(`/workspaces/${workspace}/hooks/${webhookUuid}`, data);
  }

  /**
   * Delete a workspace webhook
   */
  async deleteWorkspaceWebhook(workspace: string, webhookUuid: string): Promise<void> {
    await this.client.delete(`/workspaces/${workspace}/hooks/${webhookUuid}`);
  }
}

