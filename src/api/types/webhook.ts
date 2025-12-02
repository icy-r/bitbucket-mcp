import { z } from 'zod';
import { LinksSchema } from './common.js';

/**
 * Webhook events
 */
export const WebhookEvent = z.enum([
  // Repository events
  'repo:push',
  'repo:fork',
  'repo:updated',
  'repo:commit_comment_created',
  'repo:commit_status_created',
  'repo:commit_status_updated',
  // Issue events
  'issue:created',
  'issue:updated',
  'issue:comment_created',
  // Pull request events
  'pullrequest:created',
  'pullrequest:updated',
  'pullrequest:approved',
  'pullrequest:unapproved',
  'pullrequest:fulfilled',
  'pullrequest:rejected',
  'pullrequest:comment_created',
  'pullrequest:comment_updated',
  'pullrequest:comment_deleted',
  // Project events
  'project:updated',
]);

export type WebhookEvent = z.infer<typeof WebhookEvent>;

/**
 * Webhook schema
 */
export const WebhookSchema = z.object({
  type: z.literal('webhook_subscription'),
  uuid: z.string(),
  url: z.string().url(),
  description: z.string().optional(),
  subject_type: z.enum(['repository', 'workspace']),
  subject: z.object({
    type: z.string(),
    uuid: z.string().optional(),
    name: z.string().optional(),
    full_name: z.string().optional(),
  }),
  events: z.array(WebhookEvent),
  active: z.boolean(),
  created_at: z.string().optional(),
  links: LinksSchema.optional(),
});

export type Webhook = z.infer<typeof WebhookSchema>;

/**
 * Create webhook request
 */
export const CreateWebhookRequestSchema = z.object({
  description: z.string().optional(),
  url: z.string().url(),
  active: z.boolean().default(true),
  events: z.array(WebhookEvent),
});

export type CreateWebhookRequest = z.infer<typeof CreateWebhookRequestSchema>;

/**
 * Update webhook request
 */
export const UpdateWebhookRequestSchema = CreateWebhookRequestSchema.partial();
export type UpdateWebhookRequest = z.infer<typeof UpdateWebhookRequestSchema>;

