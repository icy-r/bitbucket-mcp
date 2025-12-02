import { z } from 'zod';
import { AccountSchema, LinksSchema, ParticipantSchema } from './common.js';
import { RepositorySchema } from './repository.js';

/**
 * Pull request state
 */
export const PullRequestState = z.enum(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED']);
export type PullRequestState = z.infer<typeof PullRequestState>;

/**
 * Pull request reference (source/destination)
 */
export const PullRequestRefSchema = z.object({
  branch: z.object({
    name: z.string(),
  }),
  commit: z
    .object({
      type: z.literal('commit'),
      hash: z.string(),
      links: LinksSchema.optional(),
    })
    .optional(),
  repository: RepositorySchema.optional(),
});

export type PullRequestRef = z.infer<typeof PullRequestRefSchema>;

/**
 * Pull request schema
 */
export const PullRequestSchema = z.object({
  type: z.literal('pullrequest'),
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  state: PullRequestState,
  author: AccountSchema,
  source: PullRequestRefSchema,
  destination: PullRequestRefSchema,
  merge_commit: z
    .object({
      hash: z.string(),
    })
    .nullable()
    .optional(),
  close_source_branch: z.boolean().optional(),
  closed_by: AccountSchema.nullable().optional(),
  reason: z.string().optional(),
  created_on: z.string(),
  updated_on: z.string(),
  comment_count: z.number().optional(),
  task_count: z.number().optional(),
  reviewers: z.array(AccountSchema).optional(),
  participants: z.array(ParticipantSchema).optional(),
  links: LinksSchema.optional(),
});

export type PullRequest = z.infer<typeof PullRequestSchema>;

/**
 * Pull request comment schema
 */
export const PullRequestCommentSchema = z.object({
  type: z.literal('pullrequest_comment'),
  id: z.number(),
  content: z.object({
    type: z.string(),
    raw: z.string(),
    markup: z.string().optional(),
    html: z.string().optional(),
  }),
  user: AccountSchema,
  created_on: z.string(),
  updated_on: z.string(),
  deleted: z.boolean().optional(),
  inline: z
    .object({
      path: z.string(),
      from: z.number().nullable().optional(),
      to: z.number().nullable().optional(),
    })
    .optional(),
  parent: z
    .object({
      id: z.number(),
    })
    .optional(),
  pullrequest: z
    .object({
      type: z.literal('pullrequest'),
      id: z.number(),
      title: z.string(),
      links: LinksSchema.optional(),
    })
    .optional(),
  links: LinksSchema.optional(),
});

export type PullRequestComment = z.infer<typeof PullRequestCommentSchema>;

/**
 * Create pull request request
 */
export const CreatePullRequestRequestSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  source: z.object({
    branch: z.object({
      name: z.string(),
    }),
    repository: z
      .object({
        full_name: z.string(),
      })
      .optional(),
  }),
  destination: z
    .object({
      branch: z.object({
        name: z.string(),
      }),
    })
    .optional(),
  reviewers: z
    .array(
      z.object({
        uuid: z.string(),
      })
    )
    .optional(),
  close_source_branch: z.boolean().optional(),
});

export type CreatePullRequestRequest = z.infer<typeof CreatePullRequestRequestSchema>;

/**
 * Merge pull request request
 */
export const MergePullRequestRequestSchema = z.object({
  type: z.literal('pullrequest').optional(),
  message: z.string().optional(),
  close_source_branch: z.boolean().optional(),
  merge_strategy: z.enum(['merge_commit', 'squash', 'fast_forward']).optional(),
});

export type MergePullRequestRequest = z.infer<typeof MergePullRequestRequestSchema>;

/**
 * Create comment request
 */
export const CreateCommentRequestSchema = z.object({
  content: z.object({
    raw: z.string(),
  }),
  parent: z
    .object({
      id: z.number(),
    })
    .optional(),
  inline: z
    .object({
      path: z.string(),
      from: z.number().nullable().optional(),
      to: z.number().nullable().optional(),
    })
    .optional(),
});

export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;

/**
 * Diff stat schema
 */
export const DiffStatSchema = z.object({
  type: z.literal('diffstat'),
  status: z.enum(['added', 'removed', 'modified', 'renamed']),
  lines_added: z.number(),
  lines_removed: z.number(),
  old: z
    .object({
      path: z.string(),
      type: z.string(),
      escaped_path: z.string().optional(),
    })
    .nullable()
    .optional(),
  new: z
    .object({
      path: z.string(),
      type: z.string(),
      escaped_path: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export type DiffStat = z.infer<typeof DiffStatSchema>;
