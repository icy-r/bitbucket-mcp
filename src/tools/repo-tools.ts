import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RepositoriesAPI } from '../api/endpoints/repositories.js';
import { BitbucketClient } from '../api/client.js';
import { paginateResult } from '../utils/pagination.js';
import { formatOutput, type OutputFormat } from '../utils/output-formatter.js';
import { REPOSITORY_COMPACT_FIELDS } from '../utils/compact-fields.js';
import { type Config } from '../config/settings.js';

/**
 * Register consolidated repository tool
 */
export function registerRepositoryTools(server: McpServer, client: BitbucketClient, config: Config): void {
  const reposApi = new RepositoriesAPI(client);

  server.tool(
    'bitbucket_repositories',
    `Manage Bitbucket repositories. Actions:
- list: List repositories in a workspace
- get: Get repository details
- create: Create a new repository
- delete: Delete a repository
- fork: Fork a repository
- get_file: Get file content from a repository
- list_source: List files/directories in a repository path`,
    {
      action: z
        .enum(['list', 'get', 'create', 'delete', 'fork', 'get_file', 'list_source'])
        .describe('Action to perform'),
      workspace: z.string().describe('Workspace slug'),
      repo_slug: z.string().optional().describe('Repository slug (required for most actions except list)'),
      // For list action
      q: z.string().optional().describe('Query string to filter repositories'),
      sort: z.string().optional().describe('Sort field (e.g., "-updated_on" for newest first)'),
      role: z.enum(['owner', 'admin', 'contributor', 'member']).optional().describe('Filter by role'),
      // For create action
      name: z.string().optional().describe('Repository display name (for create)'),
      description: z.string().optional().describe('Repository description (for create)'),
      is_private: z.boolean().optional().default(true).describe('Whether repository is private (for create)'),
      project_key: z.string().optional().describe('Project key to associate with (for create)'),
      // For fork action
      new_name: z.string().optional().describe('Name for the forked repository'),
      target_workspace: z.string().optional().describe('Target workspace for the fork'),
      // For get_file/list_source actions
      path: z.string().optional().describe('File or directory path in the repository'),
      ref: z.string().optional().default('HEAD').describe('Git ref (branch, tag, or commit hash)'),
      // Pagination
      page: z.number().optional().describe('Page number for pagination'),
      pagelen: z.number().optional().describe('Results per page (max 100)'),
      // Output format
      format: z.enum(['json', 'toon', 'compact']).optional()
        .describe('Output format: json (full), toon (compact tokens), compact (essential fields only)'),
    },
    async (params) => {
      const { action, workspace, repo_slug } = params;
      const format = (params.format ?? config.outputFormat) as OutputFormat;

      try {
        switch (action) {
          case 'list': {
            const result = await reposApi.list(workspace, {
              q: params.q,
              sort: params.sort,
              role: params.role,
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, REPOSITORY_COMPACT_FIELDS) }],
            };
          }

          case 'get': {
            if (!repo_slug) {
              return {
                content: [{ type: 'text' as const, text: 'Error: repo_slug is required for get action' }],
                isError: true,
              };
            }
            const result = await reposApi.get(workspace, repo_slug);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, REPOSITORY_COMPACT_FIELDS) }],
            };
          }

          case 'create': {
            if (!repo_slug) {
              return {
                content: [{ type: 'text' as const, text: 'Error: repo_slug is required for create action' }],
                isError: true,
              };
            }
            const result = await reposApi.create(workspace, repo_slug, {
              name: params.name,
              description: params.description,
              is_private: params.is_private,
              project: params.project_key ? { key: params.project_key } : undefined,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, REPOSITORY_COMPACT_FIELDS) }],
            };
          }

          case 'delete': {
            if (!repo_slug) {
              return {
                content: [{ type: 'text' as const, text: 'Error: repo_slug is required for delete action' }],
                isError: true,
              };
            }
            await reposApi.delete(workspace, repo_slug);
            return {
              content: [{ type: 'text' as const, text: `Repository ${workspace}/${repo_slug} deleted successfully` }],
            };
          }

          case 'fork': {
            if (!repo_slug) {
              return {
                content: [{ type: 'text' as const, text: 'Error: repo_slug is required for fork action' }],
                isError: true,
              };
            }
            const result = await reposApi.fork(workspace, repo_slug, {
              name: params.new_name,
              workspace: params.target_workspace ? { slug: params.target_workspace } : undefined,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, REPOSITORY_COMPACT_FIELDS) }],
            };
          }

          case 'get_file': {
            if (!repo_slug) {
              return {
                content: [{ type: 'text' as const, text: 'Error: repo_slug is required for get_file action' }],
                isError: true,
              };
            }
            if (!params.path) {
              return {
                content: [{ type: 'text' as const, text: 'Error: path is required for get_file action' }],
                isError: true,
              };
            }
            const result = await reposApi.getFileContent(workspace, repo_slug, params.ref || 'HEAD', params.path);
            return {
              content: [{ type: 'text' as const, text: result }],
            };
          }

          case 'list_source': {
            if (!repo_slug) {
              return {
                content: [{ type: 'text' as const, text: 'Error: repo_slug is required for list_source action' }],
                isError: true,
              };
            }
            const result = await reposApi.listSource(workspace, repo_slug, params.ref || 'HEAD', params.path || '', {
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format) }],
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
