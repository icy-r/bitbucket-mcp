import { z } from 'zod';
import { AccountSchema, LinksSchema } from './common.js';
import { RepositorySchema } from './repository.js';

/**
 * Pipeline state
 */
export const PipelineStateSchema = z.object({
  type: z.string(),
  name: z.enum([
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'PAUSED',
    'HALTED',
    'BUILDING',
    'SUCCESSFUL',
    'FAILED',
    'ERROR',
    'STOPPED',
  ]),
  result: z
    .object({
      type: z.string(),
      name: z.string(),
    })
    .optional(),
});

export type PipelineState = z.infer<typeof PipelineStateSchema>;

/**
 * Pipeline target (branch, commit, PR, etc.)
 */
export const PipelineTargetSchema = z.object({
  type: z.string(),
  ref_type: z.enum(['branch', 'tag', 'named_branch', 'bookmark']).optional(),
  ref_name: z.string().optional(),
  selector: z
    .object({
      type: z.string(),
      pattern: z.string().optional(),
    })
    .optional(),
  commit: z
    .object({
      type: z.literal('commit'),
      hash: z.string(),
      links: LinksSchema.optional(),
    })
    .optional(),
  destination: z
    .object({
      branch: z.object({
        name: z.string(),
      }),
    })
    .optional(),
  source: z
    .object({
      branch: z.object({
        name: z.string(),
      }),
    })
    .optional(),
  pullrequest: z
    .object({
      id: z.number(),
    })
    .optional(),
});

export type PipelineTarget = z.infer<typeof PipelineTargetSchema>;

/**
 * Pipeline schema
 */
export const PipelineSchema = z.object({
  type: z.literal('pipeline'),
  uuid: z.string(),
  build_number: z.number(),
  creator: AccountSchema.optional(),
  repository: RepositorySchema.optional(),
  target: PipelineTargetSchema.optional(),
  trigger: z
    .object({
      type: z.string(),
      name: z.string().optional(),
    })
    .optional(),
  state: PipelineStateSchema.optional(),
  created_on: z.string(),
  completed_on: z.string().nullable().optional(),
  build_seconds_used: z.number().optional(),
  run_number: z.number().optional(),
  duration_in_seconds: z.number().optional(),
  first_successful_build_number: z.number().optional(),
  expired: z.boolean().optional(),
  has_variables: z.boolean().optional(),
  links: LinksSchema.optional(),
});

export type Pipeline = z.infer<typeof PipelineSchema>;

/**
 * Pipeline step schema
 */
export const PipelineStepSchema = z.object({
  type: z.literal('pipeline_step'),
  uuid: z.string(),
  name: z.string().optional(),
  script_commands: z
    .array(
      z.object({
        command: z.string(),
        name: z.string().optional(),
      })
    )
    .optional(),
  state: PipelineStateSchema.optional(),
  started_on: z.string().optional(),
  completed_on: z.string().nullable().optional(),
  duration_in_seconds: z.number().optional(),
  build_seconds_used: z.number().optional(),
  run_number: z.number().optional(),
  max_time: z.number().optional(),
  image: z
    .object({
      name: z.string(),
    })
    .optional(),
  setup_commands: z.array(z.unknown()).optional(),
  teardown_commands: z.array(z.unknown()).optional(),
  links: LinksSchema.optional(),
});

export type PipelineStep = z.infer<typeof PipelineStepSchema>;

/**
 * Pipeline variable schema
 */
export const PipelineVariableSchema = z.object({
  type: z.literal('pipeline_variable'),
  uuid: z.string(),
  key: z.string(),
  value: z.string().optional(),
  secured: z.boolean(),
});

export type PipelineVariable = z.infer<typeof PipelineVariableSchema>;

/**
 * Trigger pipeline request
 */
export const TriggerPipelineRequestSchema = z.object({
  target: z.object({
    type: z.enum(['pipeline_ref_target', 'pipeline_commit_target', 'pipeline_pullrequest_target']),
    ref_type: z.enum(['branch', 'tag', 'named_branch', 'bookmark']).optional(),
    ref_name: z.string().optional(),
    commit: z
      .object({
        type: z.literal('commit'),
        hash: z.string(),
      })
      .optional(),
    selector: z
      .object({
        type: z.enum(['default', 'branches', 'tags', 'pull-requests', 'custom']),
        pattern: z.string().optional(),
      })
      .optional(),
  }),
  variables: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
        secured: z.boolean().optional(),
      })
    )
    .optional(),
});

export type TriggerPipelineRequest = z.infer<typeof TriggerPipelineRequestSchema>;
