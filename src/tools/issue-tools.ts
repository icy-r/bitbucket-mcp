import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { IssuesAPI } from '../api/endpoints/issues.js';
import { BitbucketClient } from '../api/client.js';
import { paginateResult } from '../utils/pagination.js';
import { formatOutput, type OutputFormat } from '../utils/output-formatter.js';
import { ISSUE_COMPACT_FIELDS, ISSUE_COMMENT_COMPACT_FIELDS } from '../utils/compact-fields.js';
import { type Config } from '../config/settings.js';

/**
 * Register consolidated issue tool
 */
export function registerIssueTools(server: McpServer, client: BitbucketClient, config: Config): void {
  const issuesApi = new IssuesAPI(client);

  server.tool(
    'bitbucket_issues',
    `Manage Bitbucket issue tracking. Actions:
- list: List issues in a repository
- get: Get details of a specific issue
- create: Create a new issue
- update: Update an existing issue
- delete: Delete an issue
- list_comments: List comments on an issue
- add_comment: Add a comment to an issue
- vote: Vote for an issue
- unvote: Remove vote from an issue
- watch: Watch an issue for notifications
- unwatch: Stop watching an issue`,
    {
      action: z
        .enum([
          'list',
          'get',
          'create',
          'update',
          'delete',
          'list_comments',
          'add_comment',
          'vote',
          'unvote',
          'watch',
          'unwatch',
        ])
        .describe('Action to perform'),
      workspace: z.string().describe('Workspace slug'),
      repo_slug: z.string().describe('Repository slug'),
      issue_id: z.number().optional().describe('Issue ID (required for most actions except list/create)'),
      // For create/update actions
      title: z.string().optional().describe('Issue title'),
      content: z.string().optional().describe('Issue description or comment content'),
      state: z.enum(['new', 'open', 'resolved', 'on hold', 'invalid', 'duplicate', 'wontfix', 'closed']).optional().describe('Issue state'),
      priority: z.enum(['trivial', 'minor', 'major', 'critical', 'blocker']).optional().describe('Issue priority'),
      kind: z.enum(['bug', 'enhancement', 'proposal', 'task']).optional().describe('Issue type'),
      assignee: z.string().optional().describe('Assignee username'),
      // For list action
      q: z.string().optional().describe('Query string to filter issues'),
      sort: z.string().optional().describe('Sort field'),
      reporter: z.string().optional().describe('Filter by reporter'),
      // Pagination
      page: z.number().optional().describe('Page number for pagination'),
      pagelen: z.number().optional().describe('Results per page (max 100)'),
      // Output format
      format: z.enum(['json', 'toon', 'compact']).optional()
        .describe('Output format: json (full), toon (compact tokens), compact (essential fields only)'),
    },
    async (params) => {
      const { action, workspace, repo_slug, issue_id } = params;
      const format = (params.format ?? config.outputFormat) as OutputFormat;

      try {
        switch (action) {
          case 'list': {
            const result = await issuesApi.list(workspace, repo_slug, {
              q: params.q,
              sort: params.sort,
              state: params.state,
              priority: params.priority,
              kind: params.kind,
              assignee: params.assignee,
              reporter: params.reporter,
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, ISSUE_COMPACT_FIELDS) }],
            };
          }

          case 'get': {
            if (!issue_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: issue_id is required for get action' }],
                isError: true,
              };
            }
            const result = await issuesApi.get(workspace, repo_slug, issue_id);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, ISSUE_COMPACT_FIELDS) }],
            };
          }

          case 'create': {
            if (!params.title) {
              return {
                content: [{ type: 'text' as const, text: 'Error: title is required for create action' }],
                isError: true,
              };
            }
            const result = await issuesApi.create(workspace, repo_slug, {
              title: params.title,
              content: params.content ? { raw: params.content } : undefined,
              state: params.state,
              priority: params.priority,
              kind: params.kind,
              assignee: params.assignee ? { username: params.assignee } : undefined,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, ISSUE_COMPACT_FIELDS) }],
            };
          }

          case 'update': {
            if (!issue_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: issue_id is required for update action' }],
                isError: true,
              };
            }
            const updateData: Record<string, unknown> = {};
            if (params.title) updateData.title = params.title;
            if (params.content) updateData.content = { raw: params.content };
            if (params.state) updateData.state = params.state;
            if (params.priority) updateData.priority = params.priority;
            if (params.kind) updateData.kind = params.kind;
            if (params.assignee) updateData.assignee = { username: params.assignee };
            
            const result = await issuesApi.update(workspace, repo_slug, issue_id, updateData);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, ISSUE_COMPACT_FIELDS) }],
            };
          }

          case 'delete': {
            if (!issue_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: issue_id is required for delete action' }],
                isError: true,
              };
            }
            await issuesApi.delete(workspace, repo_slug, issue_id);
            return {
              content: [{ type: 'text' as const, text: `Issue #${issue_id} deleted successfully` }],
            };
          }

          case 'list_comments': {
            if (!issue_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: issue_id is required for list_comments action' }],
                isError: true,
              };
            }
            const result = await issuesApi.listComments(workspace, repo_slug, issue_id, {
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, ISSUE_COMMENT_COMPACT_FIELDS) }],
            };
          }

          case 'add_comment': {
            if (!issue_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: issue_id is required for add_comment action' }],
                isError: true,
              };
            }
            if (!params.content) {
              return {
                content: [{ type: 'text' as const, text: 'Error: content is required for add_comment action' }],
                isError: true,
              };
            }
            const result = await issuesApi.createComment(workspace, repo_slug, issue_id, {
              content: { raw: params.content },
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, ISSUE_COMMENT_COMPACT_FIELDS) }],
            };
          }

          case 'vote': {
            if (!issue_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: issue_id is required for vote action' }],
                isError: true,
              };
            }
            await issuesApi.vote(workspace, repo_slug, issue_id);
            return {
              content: [{ type: 'text' as const, text: `Voted for issue #${issue_id}` }],
            };
          }

          case 'unvote': {
            if (!issue_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: issue_id is required for unvote action' }],
                isError: true,
              };
            }
            await issuesApi.unvote(workspace, repo_slug, issue_id);
            return {
              content: [{ type: 'text' as const, text: `Removed vote from issue #${issue_id}` }],
            };
          }

          case 'watch': {
            if (!issue_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: issue_id is required for watch action' }],
                isError: true,
              };
            }
            await issuesApi.watch(workspace, repo_slug, issue_id);
            return {
              content: [{ type: 'text' as const, text: `Now watching issue #${issue_id}` }],
            };
          }

          case 'unwatch': {
            if (!issue_id) {
              return {
                content: [{ type: 'text' as const, text: 'Error: issue_id is required for unwatch action' }],
                isError: true,
              };
            }
            await issuesApi.unwatch(workspace, repo_slug, issue_id);
            return {
              content: [{ type: 'text' as const, text: `Stopped watching issue #${issue_id}` }],
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
