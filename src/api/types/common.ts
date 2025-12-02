import { z } from 'zod';

/**
 * Common link schema
 */
export const LinkSchema = z.object({
  href: z.string().url(),
  name: z.string().optional(),
});

export type Link = z.infer<typeof LinkSchema>;

/**
 * Links object schema
 */
export const LinksSchema = z.object({
  self: LinkSchema.optional(),
  html: LinkSchema.optional(),
  avatar: LinkSchema.optional(),
  clone: z.array(LinkSchema).optional(),
  commits: LinkSchema.optional(),
  watchers: LinkSchema.optional(),
  branches: LinkSchema.optional(),
  tags: LinkSchema.optional(),
  forks: LinkSchema.optional(),
  downloads: LinkSchema.optional(),
  pullrequests: LinkSchema.optional(),
  issues: LinkSchema.optional(),
  diff: LinkSchema.optional(),
  diffstat: LinkSchema.optional(),
  comments: LinkSchema.optional(),
  approve: LinkSchema.optional(),
  merge: LinkSchema.optional(),
  decline: LinkSchema.optional(),
  activity: LinkSchema.optional(),
});

export type Links = z.infer<typeof LinksSchema>;

/**
 * User/Account schema
 */
export const AccountSchema = z.object({
  type: z.string(),
  uuid: z.string(),
  username: z.string().optional(),
  display_name: z.string(),
  nickname: z.string().optional(),
  account_id: z.string().optional(),
  links: LinksSchema.optional(),
});

export type Account = z.infer<typeof AccountSchema>;

/**
 * Workspace schema
 */
export const WorkspaceSchema = z.object({
  type: z.literal('workspace'),
  uuid: z.string(),
  name: z.string(),
  slug: z.string(),
  links: LinksSchema.optional(),
  is_private: z.boolean().optional(),
  created_on: z.string().optional(),
  updated_on: z.string().optional(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

/**
 * Project schema
 */
export const ProjectSchema = z.object({
  type: z.literal('project'),
  uuid: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  is_private: z.boolean().optional(),
  created_on: z.string().optional(),
  updated_on: z.string().optional(),
  links: LinksSchema.optional(),
  owner: AccountSchema.optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

/**
 * Participant schema (for PRs)
 */
export const ParticipantSchema = z.object({
  type: z.literal('participant'),
  user: AccountSchema,
  role: z.enum(['PARTICIPANT', 'REVIEWER']),
  approved: z.boolean(),
  state: z.enum(['approved', 'changes_requested', 'null']).nullable().optional(),
  participated_on: z.string().optional(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

