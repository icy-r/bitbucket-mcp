/**
 * Compact field definitions for each Bitbucket resource type.
 * These define the essential fields returned when using 'compact' output format.
 * Using compact format can reduce token usage by up to 76%.
 */

/**
 * Pull Request - Essential fields for PR listings and quick reference
 */
export const PR_COMPACT_FIELDS = [
  'id',
  'title',
  'state',
  'author.display_name',
  'author.uuid',
  'source.branch.name',
  'destination.branch.name',
  'created_on',
  'updated_on',
  'comment_count',
  'task_count',
];

/**
 * Pull Request Comment - Essential fields for comment listings
 */
export const PR_COMMENT_COMPACT_FIELDS = [
  'id',
  'content.raw',
  'user.display_name',
  'user.uuid',
  'created_on',
  'updated_on',
  'deleted',
  'inline.path',
  'inline.to',
];

/**
 * Repository - Essential fields for repo listings
 */
export const REPOSITORY_COMPACT_FIELDS = [
  'uuid',
  'name',
  'full_name',
  'slug',
  'is_private',
  'description',
  'language',
  'size',
  'updated_on',
  'created_on',
  'mainbranch.name',
];

/**
 * Branch - Essential fields for branch listings
 */
export const BRANCH_COMPACT_FIELDS = [
  'name',
  'target.hash',
  'target.date',
  'target.message',
  'target.author.raw',
];

/**
 * Tag - Essential fields for tag listings
 */
export const TAG_COMPACT_FIELDS = [
  'name',
  'target.hash',
  'target.date',
  'message',
  'tagger.raw',
];

/**
 * Commit - Essential fields for commit listings
 */
export const COMMIT_COMPACT_FIELDS = [
  'hash',
  'message',
  'author.raw',
  'date',
  'parents',
];

/**
 * Issue - Essential fields for issue listings
 */
export const ISSUE_COMPACT_FIELDS = [
  'id',
  'title',
  'state',
  'priority',
  'kind',
  'assignee.display_name',
  'assignee.uuid',
  'reporter.display_name',
  'created_on',
  'updated_on',
];

/**
 * Issue Comment - Essential fields for issue comment listings
 */
export const ISSUE_COMMENT_COMPACT_FIELDS = [
  'id',
  'content.raw',
  'user.display_name',
  'user.uuid',
  'created_on',
  'updated_on',
];

/**
 * Pipeline - Essential fields for pipeline listings
 */
export const PIPELINE_COMPACT_FIELDS = [
  'uuid',
  'build_number',
  'state.name',
  'state.result.name',
  'target.ref_name',
  'target.ref_type',
  'creator.display_name',
  'created_on',
  'completed_on',
  'duration_in_seconds',
];

/**
 * Pipeline Step - Essential fields for pipeline step listings
 */
export const PIPELINE_STEP_COMPACT_FIELDS = [
  'uuid',
  'name',
  'state.name',
  'state.result.name',
  'started_on',
  'completed_on',
  'duration_in_seconds',
];

/**
 * Pipeline Variable - Essential fields for variable listings
 */
export const PIPELINE_VARIABLE_COMPACT_FIELDS = [
  'uuid',
  'key',
  'value',
  'secured',
];

/**
 * Workspace - Essential fields for workspace listings
 */
export const WORKSPACE_COMPACT_FIELDS = [
  'uuid',
  'slug',
  'name',
  'is_private',
];

/**
 * Project - Essential fields for project listings
 */
export const PROJECT_COMPACT_FIELDS = [
  'uuid',
  'key',
  'name',
  'description',
  'is_private',
  'created_on',
  'updated_on',
];

/**
 * Workspace Member - Essential fields for member listings
 */
export const WORKSPACE_MEMBER_COMPACT_FIELDS = [
  'user.uuid',
  'user.display_name',
  'user.nickname',
  'workspace.slug',
];

/**
 * Webhook - Essential fields for webhook listings
 */
export const WEBHOOK_COMPACT_FIELDS = [
  'uuid',
  'url',
  'description',
  'active',
  'events',
  'created_at',
];

/**
 * Diff Stat - Essential fields for diff statistics
 */
export const DIFFSTAT_COMPACT_FIELDS = [
  'status',
  'lines_added',
  'lines_removed',
  'old.path',
  'new.path',
];

/**
 * Map of resource types to their compact fields
 */
export const COMPACT_FIELDS_MAP: Record<string, string[]> = {
  pullrequest: PR_COMPACT_FIELDS,
  pr_comment: PR_COMMENT_COMPACT_FIELDS,
  repository: REPOSITORY_COMPACT_FIELDS,
  branch: BRANCH_COMPACT_FIELDS,
  tag: TAG_COMPACT_FIELDS,
  commit: COMMIT_COMPACT_FIELDS,
  issue: ISSUE_COMPACT_FIELDS,
  issue_comment: ISSUE_COMMENT_COMPACT_FIELDS,
  pipeline: PIPELINE_COMPACT_FIELDS,
  pipeline_step: PIPELINE_STEP_COMPACT_FIELDS,
  pipeline_variable: PIPELINE_VARIABLE_COMPACT_FIELDS,
  workspace: WORKSPACE_COMPACT_FIELDS,
  project: PROJECT_COMPACT_FIELDS,
  workspace_member: WORKSPACE_MEMBER_COMPACT_FIELDS,
  webhook: WEBHOOK_COMPACT_FIELDS,
  diffstat: DIFFSTAT_COMPACT_FIELDS,
};

