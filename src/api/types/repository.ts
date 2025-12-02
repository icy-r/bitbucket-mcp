import { z } from 'zod';
import { AccountSchema, LinksSchema, ProjectSchema, WorkspaceSchema } from './common.js';

/**
 * Repository schema
 */
export const RepositorySchema = z.object({
  type: z.literal('repository'),
  uuid: z.string(),
  name: z.string(),
  full_name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  scm: z.enum(['git', 'hg']),
  is_private: z.boolean(),
  created_on: z.string(),
  updated_on: z.string(),
  size: z.number().optional(),
  language: z.string().optional(),
  has_issues: z.boolean().optional(),
  has_wiki: z.boolean().optional(),
  fork_policy: z.enum(['allow_forks', 'no_public_forks', 'no_forks']).optional(),
  mainbranch: z
    .object({
      type: z.literal('branch'),
      name: z.string(),
    })
    .optional(),
  owner: AccountSchema.optional(),
  workspace: WorkspaceSchema.optional(),
  project: ProjectSchema.optional(),
  links: LinksSchema.optional(),
});

export type Repository = z.infer<typeof RepositorySchema>;

/**
 * Branch schema
 */
export const BranchSchema = z.object({
  type: z.literal('branch'),
  name: z.string(),
  target: z
    .object({
      type: z.literal('commit'),
      hash: z.string(),
      date: z.string().optional(),
      message: z.string().optional(),
      author: z
        .object({
          type: z.string(),
          raw: z.string(),
          user: AccountSchema.optional(),
        })
        .optional(),
    })
    .optional(),
  links: LinksSchema.optional(),
  default_merge_strategy: z.string().optional(),
  merge_strategies: z.array(z.string()).optional(),
});

export type Branch = z.infer<typeof BranchSchema>;

/**
 * Tag schema
 */
export const TagSchema = z.object({
  type: z.literal('tag'),
  name: z.string(),
  target: z
    .object({
      type: z.literal('commit'),
      hash: z.string(),
      date: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
  links: LinksSchema.optional(),
});

export type Tag = z.infer<typeof TagSchema>;

/**
 * Commit schema
 */
export const CommitSchema = z.object({
  type: z.literal('commit'),
  hash: z.string(),
  date: z.string(),
  message: z.string(),
  author: z.object({
    type: z.string(),
    raw: z.string(),
    user: AccountSchema.optional(),
  }),
  summary: z
    .object({
      type: z.string(),
      raw: z.string(),
      markup: z.string().optional(),
      html: z.string().optional(),
    })
    .optional(),
  parents: z
    .array(
      z.object({
        type: z.literal('commit'),
        hash: z.string(),
        links: LinksSchema.optional(),
      })
    )
    .optional(),
  repository: RepositorySchema.optional(),
  links: LinksSchema.optional(),
});

export type Commit = z.infer<typeof CommitSchema>;

/**
 * File/Directory schema for source browsing
 */
export const TreeEntrySchema = z.object({
  type: z.enum(['commit_directory', 'commit_file']),
  path: z.string(),
  commit: z
    .object({
      type: z.literal('commit'),
      hash: z.string(),
    })
    .optional(),
  attributes: z.array(z.string()).optional(),
  size: z.number().optional(),
  mimetype: z.string().optional(),
  links: LinksSchema.optional(),
});

export type TreeEntry = z.infer<typeof TreeEntrySchema>;

/**
 * Create repository request
 */
export const CreateRepositoryRequestSchema = z.object({
  scm: z.enum(['git']).default('git'),
  name: z.string().optional(),
  description: z.string().optional(),
  is_private: z.boolean().default(true),
  fork_policy: z.enum(['allow_forks', 'no_public_forks', 'no_forks']).optional(),
  has_issues: z.boolean().optional(),
  has_wiki: z.boolean().optional(),
  project: z
    .object({
      key: z.string(),
    })
    .optional(),
  mainbranch: z
    .object({
      type: z.literal('branch'),
      name: z.string(),
    })
    .optional(),
  language: z.string().optional(),
});

export type CreateRepositoryRequest = z.infer<typeof CreateRepositoryRequestSchema>;

