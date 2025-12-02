import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PullRequestsAPI } from '../api/endpoints/pull-requests.js';
import { BitbucketClient } from '../api/client.js';
import { paginateResult } from '../utils/pagination.js';
import { formatOutput, type OutputFormat } from '../utils/output-formatter.js';
import { PR_COMPACT_FIELDS, PR_COMMENT_COMPACT_FIELDS } from '../utils/compact-fields.js';
import { type Config } from '../config/settings.js';

/**
 * Register consolidated pull request tool
 */
export function registerPullRequestTools(server: McpServer, client: BitbucketClient, config: Config): void {
  const prApi = new PullRequestsAPI(client);

  server.tool(
    'bitbucket_pull_requests',
    `Manage Bitbucket pull requests. Actions:
- list: List pull requests in a repository
- get: Get pull request details
- create: Create a new pull request
- update: Update a pull request
- merge: Merge a pull request
- approve: Approve a pull request
- unapprove: Remove approval from a pull request
- decline: Decline a pull request
- list_comments: List comments on a pull request
- add_comment: Add a comment to a pull request
- get_diff: Get the diff of a pull request`,
    {
      action: z
        .enum([
          'list',
          'get',
          'create',
          'update',
          'merge',
          'approve',
          'unapprove',
          'decline',
          'list_comments',
          'add_comment',
          'get_diff',
        ])
        .describe('Action to perform'),
      workspace: z.string().describe('Workspace slug'),
      repo_slug: z.string().describe('Repository slug'),
      pr_id: z.number().optional().describe('Pull request ID (required for most actions except list/create)'),
      // For list action
      state: z.enum(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED']).optional().describe('Filter by state'),
      q: z.string().optional().describe('Query string to filter PRs'),
      sort: z.string().optional().describe('Sort field (e.g., "-created_on")'),
      // For create/update action
      title: z.string().optional().describe('Pull request title'),
      description: z.string().optional().describe('Pull request description'),
      source_branch: z.string().optional().describe('Source branch name'),
      destination_branch: z.string().optional().describe('Destination branch (default: main branch)'),
      close_source_branch: z.boolean().optional().describe('Close source branch after merge'),
      reviewers: z.array(z.string()).optional().describe('List of reviewer UUIDs'),
      // For merge action
      merge_strategy: z
        .enum(['merge_commit', 'squash', 'fast_forward'])
        .optional()
        .describe('Merge strategy'),
      message: z.string().optional().describe('Merge commit message'),
      // For add_comment action
      content: z.string().optional().describe('Comment content (markdown supported)'),
      inline_path: z.string().optional().describe('File path for inline comment'),
      inline_line: z.number().optional().describe('Line number for inline comment'),
      parent_id: z.number().optional().describe('Parent comment ID for replies'),
      // Pagination
      page: z.number().optional().describe('Page number for pagination'),
      pagelen: z.number().optional().describe('Results per page (max 100)'),
      // Output format
      format: z.enum(['json', 'toon', 'compact']).optional()
        .describe('Output format: json (full), toon (compact tokens), compact (essential fields only)'),
    },
    async (params) => {
      const { action, workspace, repo_slug, pr_id } = params;
      const format = (params.format ?? config.outputFormat) as OutputFormat;

      try {
        switch (action) {
          case 'list': {
            const result = await prApi.list(workspace, repo_slug, {
              state: params.state,
              q: params.q,
              sort: params.sort,
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, PR_COMPACT_FIELDS) }],
            };
          }

          case 'get': {
            if (!pr_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: pr_id is required for get action' }],
                isError: true,
              };
            }
            const result = await prApi.get(workspace, repo_slug, pr_id);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, PR_COMPACT_FIELDS) }],
            };
          }

          case 'create': {
            if (!params.title || !params.source_branch) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: title and source_branch are required for create action' },
                ],
                isError: true,
              };
            }
            const result = await prApi.create(workspace, repo_slug, {
              title: params.title,
              description: params.description,
              source: { branch: { name: params.source_branch } },
              destination: params.destination_branch
                ? { branch: { name: params.destination_branch } }
                : undefined,
              close_source_branch: params.close_source_branch,
              reviewers: params.reviewers?.map((uuid) => ({ uuid })),
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, PR_COMPACT_FIELDS) }],
            };
          }

          case 'update': {
            if (!pr_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: pr_id is required for update action' }],
                isError: true,
              };
            }
            const updateData: Record<string, unknown> = {};
            if (params.title) updateData.title = params.title;
            if (params.description) updateData.description = params.description;
            if (params.destination_branch) {
              updateData.destination = { branch: { name: params.destination_branch } };
            }
            if (params.reviewers) {
              updateData.reviewers = params.reviewers.map((uuid) => ({ uuid }));
            }
            const result = await prApi.update(workspace, repo_slug, pr_id, updateData);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, PR_COMPACT_FIELDS) }],
            };
          }

          case 'merge': {
            if (!pr_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: pr_id is required for merge action' }],
                isError: true,
              };
            }
            const result = await prApi.merge(workspace, repo_slug, pr_id, {
              type: 'pullrequest',
              message: params.message,
              close_source_branch: params.close_source_branch,
              merge_strategy: params.merge_strategy,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, PR_COMPACT_FIELDS) }],
            };
          }

          case 'approve': {
            if (!pr_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: pr_id is required for approve action' }],
                isError: true,
              };
            }
            const result = await prApi.approve(workspace, repo_slug, pr_id);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format) }],
            };
          }

          case 'unapprove': {
            if (!pr_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: pr_id is required for unapprove action' }],
                isError: true,
              };
            }
            await prApi.unapprove(workspace, repo_slug, pr_id);
            return {
              content: [{ type: 'text' as const, text: 'Approval removed successfully' }],
            };
          }

          case 'decline': {
            if (!pr_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: pr_id is required for decline action' }],
                isError: true,
              };
            }
            const result = await prApi.decline(workspace, repo_slug, pr_id);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, PR_COMPACT_FIELDS) }],
            };
          }

          case 'list_comments': {
            if (!pr_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: pr_id is required for list_comments action' }],
                isError: true,
              };
            }
            const result = await prApi.listComments(workspace, repo_slug, pr_id, {
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, PR_COMMENT_COMPACT_FIELDS) }],
            };
          }

          case 'add_comment': {
            if (!pr_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: pr_id is required for add_comment action' }],
                isError: true,
              };
            }
            if (!params.content) {
              return {
                content: [{ type: 'text' as const, text: 'Error: content is required for add_comment action' }],
                isError: true,
              };
            }
            const commentData: Record<string, unknown> = {
              content: { raw: params.content },
            };
            if (params.inline_path && params.inline_line) {
              commentData.inline = {
                path: params.inline_path,
                to: params.inline_line,
              };
            }
            if (params.parent_id) {
              commentData.parent = { id: params.parent_id };
            }
            const result = await prApi.createComment(workspace, repo_slug, pr_id, commentData as Parameters<typeof prApi.createComment>[3]);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, PR_COMMENT_COMPACT_FIELDS) }],
            };
          }

          case 'get_diff': {
            if (!pr_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: pr_id is required for get_diff action' }],
                isError: true,
              };
            }
            const result = await prApi.getDiff(workspace, repo_slug, pr_id);
            return {
              content: [{ type: 'text' as const, text: result }],
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
