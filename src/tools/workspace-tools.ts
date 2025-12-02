import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WorkspacesAPI } from '../api/endpoints/workspaces.js';
import { BitbucketClient } from '../api/client.js';
import { paginateResult } from '../utils/pagination.js';
import { formatOutput, type OutputFormat } from '../utils/output-formatter.js';
import { WORKSPACE_COMPACT_FIELDS, PROJECT_COMPACT_FIELDS, WORKSPACE_MEMBER_COMPACT_FIELDS } from '../utils/compact-fields.js';
import { type Config } from '../config/settings.js';

/**
 * Register consolidated workspace tool
 */
export function registerWorkspaceTools(server: McpServer, client: BitbucketClient, config: Config): void {
  const workspacesApi = new WorkspacesAPI(client);

  server.tool(
    'bitbucket_workspaces',
    `Manage Bitbucket workspaces. Actions:
- list: List all accessible workspaces
- get: Get details of a specific workspace
- list_projects: List projects in a workspace
- list_members: List members of a workspace`,
    {
      action: z.enum(['list', 'get', 'list_projects', 'list_members']).describe('Action to perform'),
      workspace: z.string().optional().describe('Workspace slug (required for get, list_projects, list_members)'),
      page: z.number().optional().describe('Page number for pagination'),
      pagelen: z.number().optional().describe('Results per page (max 100)'),
      // Output format
      format: z.enum(['json', 'toon', 'compact']).optional()
        .describe('Output format: json (full), toon (compact tokens), compact (essential fields only)'),
    },
    async (params) => {
      const { action, workspace, page, pagelen } = params;
      const format = (params.format ?? config.outputFormat) as OutputFormat;

      try {
        switch (action) {
          case 'list': {
            const result = await workspacesApi.list({ page, pagelen });
            return {
              content: [
                {
                  type: 'text' as const,
                  text: formatOutput(paginateResult(result), format, WORKSPACE_COMPACT_FIELDS),
                },
              ],
            };
          }

          case 'get': {
            if (!workspace) {
              return {
                content: [{ type: 'text' as const, text: 'Error: workspace is required for get action' }],
                isError: true,
              };
            }
            const result = await workspacesApi.get(workspace);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, WORKSPACE_COMPACT_FIELDS) }],
            };
          }

          case 'list_projects': {
            if (!workspace) {
              return {
                content: [{ type: 'text' as const, text: 'Error: workspace is required for list_projects action' }],
                isError: true,
              };
            }
            const result = await workspacesApi.listProjects(workspace, { page, pagelen });
            return {
              content: [
                {
                  type: 'text' as const,
                  text: formatOutput(paginateResult(result), format, PROJECT_COMPACT_FIELDS),
                },
              ],
            };
          }

          case 'list_members': {
            if (!workspace) {
              return {
                content: [{ type: 'text' as const, text: 'Error: workspace is required for list_members action' }],
                isError: true,
              };
            }
            const result = await workspacesApi.listMembers(workspace, { page, pagelen });
            return {
              content: [
                {
                  type: 'text' as const,
                  text: formatOutput(paginateResult(result), format, WORKSPACE_MEMBER_COMPACT_FIELDS),
                },
              ],
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
