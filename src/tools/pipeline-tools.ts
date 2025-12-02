import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PipelinesAPI } from '../api/endpoints/pipelines.js';
import { BitbucketClient } from '../api/client.js';
import { paginateResult } from '../utils/pagination.js';
import { formatOutput, type OutputFormat } from '../utils/output-formatter.js';
import { PIPELINE_COMPACT_FIELDS, PIPELINE_STEP_COMPACT_FIELDS, PIPELINE_VARIABLE_COMPACT_FIELDS } from '../utils/compact-fields.js';
import { type Config } from '../config/settings.js';

/**
 * Register consolidated pipeline tool
 */
export function registerPipelineTools(server: McpServer, client: BitbucketClient, config: Config): void {
  const pipelinesApi = new PipelinesAPI(client);

  server.tool(
    'bitbucket_pipelines',
    `Manage Bitbucket Pipelines CI/CD. Actions:
- list: List pipelines in a repository
- get: Get details of a specific pipeline
- trigger: Trigger a new pipeline run on a branch
- trigger_custom: Trigger a custom pipeline with a specific pattern
- stop: Stop a running pipeline
- list_steps: List steps of a pipeline
- get_step: Get details of a specific step
- get_logs: Get logs for a pipeline step
- get_config: Get pipeline configuration (enabled status)
- set_enabled: Enable or disable pipelines for a repository
- list_variables: List pipeline variables
- get_variable: Get a specific pipeline variable
- create_variable: Create a pipeline variable
- update_variable: Update a pipeline variable
- delete_variable: Delete a pipeline variable`,
    {
      action: z
        .enum([
          'list',
          'get',
          'trigger',
          'trigger_custom',
          'stop',
          'list_steps',
          'get_step',
          'get_logs',
          'get_config',
          'set_enabled',
          'list_variables',
          'get_variable',
          'create_variable',
          'update_variable',
          'delete_variable',
        ])
        .describe('Action to perform'),
      workspace: z.string().describe('Workspace slug'),
      repo_slug: z.string().describe('Repository slug'),
      // For get/stop/list_steps actions
      pipeline_uuid: z.string().optional().describe('Pipeline UUID'),
      // For get_step/get_logs actions
      step_uuid: z.string().optional().describe('Step UUID'),
      // For trigger actions
      branch: z.string().optional().describe('Branch name to trigger pipeline on'),
      pattern: z.string().optional().describe('Custom pipeline pattern (for trigger_custom)'),
      variables: z
        .array(
          z.object({
            key: z.string(),
            value: z.string(),
            secured: z.boolean().optional(),
          })
        )
        .optional()
        .describe('Pipeline variables for trigger'),
      // For set_enabled action
      enabled: z.boolean().optional().describe('Enable or disable pipelines'),
      // For variable actions
      variable_uuid: z.string().optional().describe('Variable UUID'),
      key: z.string().optional().describe('Variable key'),
      value: z.string().optional().describe('Variable value'),
      secured: z.boolean().optional().describe('Whether variable is secured'),
      // For list action
      sort: z.string().optional().describe('Sort field'),
      target_branch: z.string().optional().describe('Filter by target branch'),
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
            const result = await pipelinesApi.list(workspace, repo_slug, {
              sort: params.sort,
              'target.branch': params.target_branch,
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, PIPELINE_COMPACT_FIELDS) }],
            };
          }

          case 'get': {
            if (!params.pipeline_uuid) {
              return {
                content: [{ type: 'text' as const, text: 'Error: pipeline_uuid is required for get action' }],
                isError: true,
              };
            }
            const result = await pipelinesApi.get(workspace, repo_slug, params.pipeline_uuid);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, PIPELINE_COMPACT_FIELDS) }],
            };
          }

          case 'trigger': {
            if (!params.branch) {
              return {
                content: [{ type: 'text' as const, text: 'Error: branch is required for trigger action' }],
                isError: true,
              };
            }
            const result = await pipelinesApi.triggerBranch(workspace, repo_slug, params.branch, params.variables);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, PIPELINE_COMPACT_FIELDS) }],
            };
          }

          case 'trigger_custom': {
            if (!params.branch || !params.pattern) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: branch and pattern are required for trigger_custom action' },
                ],
                isError: true,
              };
            }
            const result = await pipelinesApi.triggerCustom(
              workspace,
              repo_slug,
              params.branch,
              params.pattern,
              params.variables
            );
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, PIPELINE_COMPACT_FIELDS) }],
            };
          }

          case 'stop': {
            if (!params.pipeline_uuid) {
              return {
                content: [{ type: 'text' as const, text: 'Error: pipeline_uuid is required for stop action' }],
                isError: true,
              };
            }
            await pipelinesApi.stop(workspace, repo_slug, params.pipeline_uuid);
            return {
              content: [{ type: 'text' as const, text: 'Pipeline stopped successfully' }],
            };
          }

          case 'list_steps': {
            if (!params.pipeline_uuid) {
              return {
                content: [{ type: 'text' as const, text: 'Error: pipeline_uuid is required for list_steps action' }],
                isError: true,
              };
            }
            const result = await pipelinesApi.listSteps(workspace, repo_slug, params.pipeline_uuid, {
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, PIPELINE_STEP_COMPACT_FIELDS) }],
            };
          }

          case 'get_step': {
            if (!params.pipeline_uuid || !params.step_uuid) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: 'Error: pipeline_uuid and step_uuid are required for get_step action',
                  },
                ],
                isError: true,
              };
            }
            const result = await pipelinesApi.getStep(workspace, repo_slug, params.pipeline_uuid, params.step_uuid);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, PIPELINE_STEP_COMPACT_FIELDS) }],
            };
          }

          case 'get_logs': {
            if (!params.pipeline_uuid || !params.step_uuid) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: pipeline_uuid and step_uuid are required for get_logs action' },
                ],
                isError: true,
              };
            }
            const result = await pipelinesApi.getStepLogs(
              workspace,
              repo_slug,
              params.pipeline_uuid,
              params.step_uuid
            );
            return {
              content: [{ type: 'text' as const, text: result }],
            };
          }

          case 'get_config': {
            const result = await pipelinesApi.getConfig(workspace, repo_slug);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format) }],
            };
          }

          case 'set_enabled': {
            if (params.enabled === undefined) {
              return {
                content: [{ type: 'text' as const, text: 'Error: enabled is required for set_enabled action' }],
                isError: true,
              };
            }
            await pipelinesApi.setEnabled(workspace, repo_slug, params.enabled);
            return {
              content: [
                { type: 'text' as const, text: `Pipelines ${params.enabled ? 'enabled' : 'disabled'} successfully` },
              ],
            };
          }

          case 'list_variables': {
            const result = await pipelinesApi.listVariables(workspace, repo_slug, {
              page: params.page,
              pagelen: params.pagelen,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(paginateResult(result), format, PIPELINE_VARIABLE_COMPACT_FIELDS) }],
            };
          }

          case 'get_variable': {
            if (!params.variable_uuid) {
              return {
                content: [{ type: 'text' as const, text: 'Error: variable_uuid is required for get_variable action' }],
                isError: true,
              };
            }
            const result = await pipelinesApi.getVariable(workspace, repo_slug, params.variable_uuid);
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, PIPELINE_VARIABLE_COMPACT_FIELDS) }],
            };
          }

          case 'create_variable': {
            if (!params.key || !params.value) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: key and value are required for create_variable action' },
                ],
                isError: true,
              };
            }
            const result = await pipelinesApi.createVariable(workspace, repo_slug, {
              key: params.key,
              value: params.value,
              secured: params.secured,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, PIPELINE_VARIABLE_COMPACT_FIELDS) }],
            };
          }

          case 'update_variable': {
            if (!params.variable_uuid) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: variable_uuid is required for update_variable action' },
                ],
                isError: true,
              };
            }
            const result = await pipelinesApi.updateVariable(workspace, repo_slug, params.variable_uuid, {
              key: params.key,
              value: params.value,
              secured: params.secured,
            });
            return {
              content: [{ type: 'text' as const, text: formatOutput(result, format, PIPELINE_VARIABLE_COMPACT_FIELDS) }],
            };
          }

          case 'delete_variable': {
            if (!params.variable_uuid) {
              return {
                content: [
                  { type: 'text' as const, text: 'Error: variable_uuid is required for delete_variable action' },
                ],
                isError: true,
              };
            }
            await pipelinesApi.deleteVariable(workspace, repo_slug, params.variable_uuid);
            return {
              content: [{ type: 'text' as const, text: 'Variable deleted successfully' }],
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
