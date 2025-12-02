import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RepositoriesAPI } from '../api/endpoints/repositories.js';
import { BitbucketClient } from '../api/client.js';
import { paginateResult } from '../utils/pagination.js';
import { formatOutput, type OutputFormat } from '../utils/output-formatter.js';
import { COMMIT_COMPACT_FIELDS, DIFFSTAT_COMPACT_FIELDS } from '../utils/compact-fields.js';
import { type Config } from '../config/settings.js';

/**
 * Register consolidated commit tool
 */
export function registerCommitTools(server: McpServer, client: BitbucketClient, config: Config): void {
  const reposApi = new RepositoriesAPI(client);

  server.tool(
    'bitbucket_commits',
    `Manage Bitbucket commits and diffs. Actions:
- list: List commits in a repository
- get: Get details of a specific commit
- get_diff: Get diff between two refs (e.g., "branch1..branch2" or "commit1..commit2")
- get_diffstat: Get diffstat (summary of changes) between two refs`,
    {
      action: z.enum(['list', 'get', 'get_diff', 'get_diffstat']).describe('Action to perform'),
      workspace: z.string().describe('Workspace slug'),
      repo_slug: z.string().describe('Repository slug'),
      // For get action
      commit_hash: z.string().optional().describe('Commit hash (required for get action)'),
      // For list action
      revision: z.string().optional().describe('Branch name or commit hash to list commits from'),
      path: z.string().optional().describe('Filter commits by file path'),
      include: z.string().optional().describe('Include commits reachable from this ref'),
      exclude: z.string().optional().describe('Exclude commits reachable from this ref'),
      // For diff actions
      spec: z.string().optional().describe('Diff spec (e.g., "main..feature" or "abc123..def456")'),
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
            const result = await reposApi.listCommits(workspace, repo_slug, {
              revision: params.revision,
              path: params.path,
              include: params.include,
              exclude: params.exclude,
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, COMMIT_COMPACT_FIELDS) }],
            };
          }

          case 'get': {
            if (!params.commit_hash) {
              return {
                content: [{ type: 'text' as const, text: 'Error: commit_hash is required for get action' }],
                isError: true,
              };
            }
            const result = await reposApi.getCommit(workspace, repo_slug, params.commit_hash);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, COMMIT_COMPACT_FIELDS) }],
            };
          }

          case 'get_diff': {
            if (!params.spec) {
              return {
                content: [{ type: 'text' as const, text: 'Error: spec is required for get_diff action (e.g., "main..feature")' }],
                isError: true,
              };
            }
            const result = await reposApi.getDiff(workspace, repo_slug, params.spec);
            return {
              content: [{ type: 'text' as const, text: result }],
            };
          }

          case 'get_diffstat': {
            if (!params.spec) {
              return {
                content: [{ type: 'text' as const, text: 'Error: spec is required for get_diffstat action (e.g., "main..feature")' }],
                isError: true,
              };
            }
            const result = await reposApi.getDiffStat(workspace, repo_slug, params.spec, {
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, DIFFSTAT_COMPACT_FIELDS) }],
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
