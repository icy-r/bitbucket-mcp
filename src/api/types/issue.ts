import { z } from 'zod';
import { AccountSchema, LinksSchema } from './common.js';
import { RepositorySchema } from './repository.js';

/**
 * Issue priority
 */
export const IssuePriority = z.enum(['trivial', 'minor', 'major', 'critical', 'blocker']);
export type IssuePriority = z.infer<typeof IssuePriority>;

/**
 * Issue state
 */
export const IssueState = z.enum(['new', 'open', 'resolved', 'on hold', 'invalid', 'duplicate', 'wontfix', 'closed']);
export type IssueState = z.infer<typeof IssueState>;

/**
 * Issue kind
 */
export const IssueKind = z.enum(['bug', 'enhancement', 'proposal', 'task']);
export type IssueKind = z.infer<typeof IssueKind>;

/**
 * Issue schema
 */
export const IssueSchema = z.object({
  type: z.literal('issue'),
  id: z.number(),
  title: z.string(),
  content: z
    .object({
      type: z.string(),
      raw: z.string(),
      markup: z.string().optional(),
      html: z.string().optional(),
    })
    .optional(),
  reporter: AccountSchema.optional(),
  assignee: AccountSchema.nullable().optional(),
  state: IssueState,
  kind: IssueKind,
  priority: IssuePriority,
  milestone: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  component: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  version: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  votes: z.number().optional(),
  watches: z.number().optional(),
  created_on: z.string(),
  updated_on: z.string(),
  edited_on: z.string().nullable().optional(),
  repository: RepositorySchema.optional(),
  links: LinksSchema.optional(),
});

export type Issue = z.infer<typeof IssueSchema>;

/**
 * Issue comment schema
 */
export const IssueCommentSchema = z.object({
  type: z.literal('issue_comment'),
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
  issue: z
    .object({
      type: z.literal('issue'),
      id: z.number(),
      title: z.string(),
      links: LinksSchema.optional(),
    })
    .optional(),
  links: LinksSchema.optional(),
});

export type IssueComment = z.infer<typeof IssueCommentSchema>;

/**
 * Create issue request
 */
export const CreateIssueRequestSchema = z.object({
  title: z.string(),
  content: z
    .object({
      raw: z.string(),
    })
    .optional(),
  kind: IssueKind.optional(),
  priority: IssuePriority.optional(),
  state: IssueState.optional(),
  assignee: z
    .object({
      uuid: z.string(),
    })
    .optional(),
  milestone: z
    .object({
      id: z.number(),
    })
    .optional(),
  component: z
    .object({
      id: z.number(),
    })
    .optional(),
  version: z
    .object({
      id: z.number(),
    })
    .optional(),
});

export type CreateIssueRequest = z.infer<typeof CreateIssueRequestSchema>;

/**
 * Update issue request
 */
export const UpdateIssueRequestSchema = CreateIssueRequestSchema.partial();
export type UpdateIssueRequest = z.infer<typeof UpdateIssueRequestSchema>;

/**
 * Create issue comment request
 */
export const CreateIssueCommentRequestSchema = z.object({
  content: z.object({
    raw: z.string(),
  }),
});

export type CreateIssueCommentRequest = z.infer<typeof CreateIssueCommentRequestSchema>;

