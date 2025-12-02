import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WebhooksAPI } from '../api/endpoints/webhooks.js';
import { BitbucketClient } from '../api/client.js';
import { paginateResult } from '../utils/pagination.js';
import { formatOutput, type OutputFormat } from '../utils/output-formatter.js';
import { WEBHOOK_COMPACT_FIELDS } from '../utils/compact-fields.js';
import { type Config } from '../config/settings.js';

/**
 * Register consolidated webhook tool
 */
export function registerWebhookTools(server: McpServer, client: BitbucketClient, config: Config): void {
  const webhooksApi = new WebhooksAPI(client);

  server.tool(
    'bitbucket_webhooks',
    `Manage Bitbucket webhooks for repositories and workspaces. Actions:
- list: List webhooks for a repository
- get: Get details of a specific webhook
- create: Create a new webhook
- update: Update an existing webhook
- delete: Delete a webhook
- list_workspace: List webhooks for a workspace
- get_workspace: Get a workspace webhook
- create_workspace: Create a workspace webhook
- update_workspace: Update a workspace webhook
- delete_workspace: Delete a workspace webhook`,
    {
      action: z
        .enum([
          'list',
          'get',
          'create',
          'update',
          'delete',
          'list_workspace',
          'get_workspace',
          'create_workspace',
          'update_workspace',
          'delete_workspace',
        ])
        .describe('Action to perform'),
      workspace: z.string().describe('Workspace slug'),
      repo_slug: z.string().optional().describe('Repository slug (required for repo-level webhooks)'),
      webhook_uuid: z.string().optional().describe('Webhook UUID (required for get/update/delete)'),
      // For create/update actions
      url: z.string().optional().describe('Webhook URL'),
      description: z.string().optional().describe('Webhook description'),
      active: z.boolean().optional().describe('Whether webhook is active'),
      events: z
        .array(z.string())
        .optional()
        .describe('List of events to trigger webhook (e.g., "repo:push", "pullrequest:created")'),
      secret: z.string().optional().describe('Webhook secret for signature verification'),
      // Pagination
      page: z.number().optional().describe('Page number for pagination'),
      pagelen: z.number().optional().describe('Results per page (max 100)'),
      // Output format
      format: z.enum(['json', 'toon', 'compact']).optional()
        .describe('Output format: json (full), toon (compact tokens), compact (essential fields only)'),
    },
    async (params) => {
      const { action, workspace, repo_slug, webhook_uuid } = params;
      const format = (params.format ?? config.outputFormat) as OutputFormat;

      try {
        switch (action) {
          case 'list': {
            if (!repo_slug) {
              return {
                content: [{ type: 'text' as const, text: 'Error: repo_slug is required for list action' }],
                isError: true,
              };
            }
            const result = await webhooksApi.list(workspace, repo_slug, {
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, WEBHOOK_COMPACT_FIELDS) }],
            };
          }

          case 'get': {
            if (!repo_slug || !webhook_uuid) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: repo_slug and webhook_uuid are required for get action' },
                ],
                isError: true,
              };
            }
            const result = await webhooksApi.get(workspace, repo_slug, webhook_uuid);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, WEBHOOK_COMPACT_FIELDS) }],
            };
          }

          case 'create': {
            if (!repo_slug || !params.url || !params.events) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: 'Error: repo_slug, url, and events are required for create action',
                  },
                ],
                isError: true,
              };
            }
            const result = await webhooksApi.create(workspace, repo_slug, {
              url: params.url,
              description: params.description,
              active: params.active ?? true,
              events: params.events,
              secret: params.secret,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, WEBHOOK_COMPACT_FIELDS) }],
            };
          }

          case 'update': {
            if (!repo_slug || !webhook_uuid) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: repo_slug and webhook_uuid are required for update action' },
                ],
                isError: true,
              };
            }
            const updateData: Record<string, unknown> = {};
            if (params.url) updateData.url = params.url;
            if (params.description) updateData.description = params.description;
            if (params.active !== undefined) updateData.active = params.active;
            if (params.events) updateData.events = params.events;
            if (params.secret) updateData.secret = params.secret;

            const result = await webhooksApi.update(workspace, repo_slug, webhook_uuid, updateData);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, WEBHOOK_COMPACT_FIELDS) }],
            };
          }

          case 'delete': {
            if (!repo_slug || !webhook_uuid) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: repo_slug and webhook_uuid are required for delete action' },
                ],
                isError: true,
              };
            }
            await webhooksApi.delete(workspace, repo_slug, webhook_uuid);
            return {
              content: [{ type: 'text' as const, text: 'Webhook deleted successfully' }],
            };
          }

          case 'list_workspace': {
            const result = await webhooksApi.listWorkspaceWebhooks(workspace, {
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, WEBHOOK_COMPACT_FIELDS) }],
            };
          }

          case 'get_workspace': {
            if (!webhook_uuid) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: webhook_uuid is required for get_workspace action' },
                ],
                isError: true,
              };
            }
            const result = await webhooksApi.getWorkspaceWebhook(workspace, webhook_uuid);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, WEBHOOK_COMPACT_FIELDS) }],
            };
          }

          case 'create_workspace': {
            if (!params.url || !params.events) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: url and events are required for create_workspace action' },
                ],
                isError: true,
              };
            }
            const result = await webhooksApi.createWorkspaceWebhook(workspace, {
              url: params.url,
              description: params.description,
              active: params.active ?? true,
              events: params.events,
              secret: params.secret,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, WEBHOOK_COMPACT_FIELDS) }],
            };
          }

          case 'update_workspace': {
            if (!webhook_uuid) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: webhook_uuid is required for update_workspace action' },
                ],
                isError: true,
              };
            }
            const updateData: Record<string, unknown> = {};
            if (params.url) updateData.url = params.url;
            if (params.description) updateData.description = params.description;
            if (params.active !== undefined) updateData.active = params.active;
            if (params.events) updateData.events = params.events;
            if (params.secret) updateData.secret = params.secret;

            const result = await webhooksApi.updateWorkspaceWebhook(workspace, webhook_uuid, updateData);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, WEBHOOK_COMPACT_FIELDS) }],
            };
          }

          case 'delete_workspace': {
            if (!webhook_uuid) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: webhook_uuid is required for delete_workspace action' },
                ],
                isError: true,
              };
            }
            await webhooksApi.deleteWorkspaceWebhook(workspace, webhook_uuid);
            return {
              content: [{ type: 'text' as const, text: 'Workspace webhook deleted successfully' }],
            };
          }

          default:
            return {
              content: [{ type: 'text' as const, text: `Unknown action: ${action}` }],
              isError: true,
            };
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
