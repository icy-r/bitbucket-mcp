import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RepositoriesAPI } from '../api/endpoints/repositories.js';
import { BitbucketClient } from '../api/client.js';
import { paginateResult } from '../utils/pagination.js';
import { formatOutput, type OutputFormat } from '../utils/output-formatter.js';
import { BRANCH_COMPACT_FIELDS, TAG_COMPACT_FIELDS } from '../utils/compact-fields.js';
import { type Config } from '../config/settings.js';

/**
 * Register consolidated branch tool
 */
export function registerBranchTools(server: McpServer, client: BitbucketClient, config: Config): void {
  const reposApi = new RepositoriesAPI(client);

  server.tool(
    'bitbucket_branches',
    `Manage Bitbucket branches and tags. Actions:
- list_branches: List all branches in a repository
- get_branch: Get details of a specific branch
- create_branch: Create a new branch from a commit/ref
- delete_branch: Delete a branch
- list_tags: List all tags in a repository
- get_tag: Get details of a specific tag
- create_tag: Create a new tag`,
    {
      action: z
        .enum(['list_branches', 'get_branch', 'create_branch', 'delete_branch', 'list_tags', 'get_tag', 'create_tag'])
        .describe('Action to perform'),
      workspace: z.string().describe('Workspace slug'),
      repo_slug: z.string().describe('Repository slug'),
      // For get/delete/create branch
      branch_name: z.string().optional().describe('Branch name'),
      // For get/create tag
      tag_name: z.string().optional().describe('Tag name'),
      // For create branch/tag
      target: z.string().optional().describe('Target commit hash or ref for create operations'),
      message: z.string().optional().describe('Tag message (for annotated tags)'),
      // For list operations
      q: z.string().optional().describe('Query string to filter results'),
      sort: z.string().optional().describe('Sort field'),
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
          case 'list_branches': {
            const result = await reposApi.listBranches(workspace, repo_slug, {
              q: params.q,
              sort: params.sort,
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, BRANCH_COMPACT_FIELDS) }],
            };
          }

          case 'get_branch': {
            if (!params.branch_name) {
              return {
                content: [{ type: 'text' as const, text: 'Error: branch_name is required for get_branch action' }],
                isError: true,
              };
            }
            const result = await reposApi.getBranch(workspace, repo_slug, params.branch_name);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, BRANCH_COMPACT_FIELDS) }],
            };
          }

          case 'create_branch': {
            if (!params.branch_name || !params.target) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: 'Error: branch_name and target are required for create_branch action',
                  },
                ],
                isError: true,
              };
            }
            const result = await reposApi.createBranch(workspace, repo_slug, params.branch_name, params.target);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, BRANCH_COMPACT_FIELDS) }],
            };
          }

          case 'delete_branch': {
            if (!params.branch_name) {
              return {
                content: [{ type: 'text' as const, text: 'Error: branch_name is required for delete_branch action' }],
                isError: true,
              };
            }
            await reposApi.deleteBranch(workspace, repo_slug, params.branch_name);
            return {
              content: [{ type: 'text' as const, text: `Branch ${params.branch_name} deleted successfully` }],
            };
          }

          case 'list_tags': {
            const result = await reposApi.listTags(workspace, repo_slug, {
              q: params.q,
              sort: params.sort,
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, TAG_COMPACT_FIELDS) }],
            };
          }

          case 'get_tag': {
            if (!params.tag_name) {
              return {
                content: [{ type: 'text' as const, text: 'Error: tag_name is required for get_tag action' }],
                isError: true,
              };
            }
            const result = await reposApi.getTag(workspace, repo_slug, params.tag_name);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, TAG_COMPACT_FIELDS) }],
            };
          }

          case 'create_tag': {
            if (!params.tag_name || !params.target) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: tag_name and target are required for create_tag action' },
                ],
                isError: true,
              };
            }
            const result = await reposApi.createTag(
              workspace,
              repo_slug,
              params.tag_name,
              params.target,
              params.message
            );
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, TAG_COMPACT_FIELDS) }],
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
