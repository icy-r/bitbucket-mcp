import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Config } from './config/settings.js';
import { BitbucketClient } from './api/client.js';
import { createAuthProvider, type AuthProvider } from './auth/index.js';
import {
  registerWorkspaceTools,
  registerRepositoryTools,
  registerPullRequestTools,
  registerBranchTools,
  registerCommitTools,
  registerPipelineTools,
  registerIssueTools,
  registerWebhookTools,
} from './tools/index.js';
import { logger } from './utils/logger.js';

/**
 * Bitbucket MCP Server
 * 
 * Provides 8 consolidated tools for AI agents:
 * - bitbucket_workspaces: Manage workspaces (list, get, projects, members)
 * - bitbucket_repositories: Manage repos (list, get, create, delete, fork, files)
 * - bitbucket_pull_requests: Manage PRs (list, get, create, merge, approve, comments)
 * - bitbucket_branches: Manage branches and tags
 * - bitbucket_commits: View commits and diffs
 * - bitbucket_pipelines: CI/CD pipelines and variables
 * - bitbucket_issues: Issue tracking
 * - bitbucket_webhooks: Webhook management
 * 
 * Output format options (TOON optimization for LLM token savings):
 * - json: Full JSON output (default)
 * - toon: TOON format (50-70% token savings)
 * - compact: Essential fields only in TOON format (up to 76% token savings)
 */
export class BitbucketMCPServer {
  private readonly server: McpServer;
  private readonly client: BitbucketClient;
  private readonly authProvider: AuthProvider;
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
    
    // Set log level
    logger.setLevel(config.logLevel);

    // Create auth provider
    this.authProvider = createAuthProvider(config);

    // Create API client
    this.client = new BitbucketClient(config, this.authProvider);

    // Create MCP server
    this.server = new McpServer({
      name: 'bitbucket-mcp',
      version: '1.0.0',
    });

    // Register all tools
    this.registerTools();

    logger.info('Bitbucket MCP server initialized', {
      authMethod: config.authMethod,
      baseUrl: config.baseUrl,
      outputFormat: config.outputFormat,
    });
  }

  /**
   * Register all MCP tools (8 consolidated tools)
   */
  private registerTools(): void {
    logger.debug('Registering MCP tools');

    // Workspace tools (1 tool with 4 actions)
    registerWorkspaceTools(this.server, this.client, this.config);

    // Repository tools (1 tool with 7 actions)
    registerRepositoryTools(this.server, this.client, this.config);

    // Pull request tools (1 tool with 11 actions)
    registerPullRequestTools(this.server, this.client, this.config);

    // Branch tools (1 tool with 7 actions)
    registerBranchTools(this.server, this.client, this.config);

    // Commit tools (1 tool with 4 actions)
    registerCommitTools(this.server, this.client, this.config);

    // Pipeline tools (1 tool with 15 actions)
    registerPipelineTools(this.server, this.client, this.config);

    // Issue tools (1 tool with 11 actions)
    registerIssueTools(this.server, this.client, this.config);

    // Webhook tools (1 tool with 10 actions)
    registerWebhookTools(this.server, this.client, this.config);

    logger.info('All MCP tools registered successfully (8 consolidated tools)');
  }

  /**
   * Get the MCP server instance
   */
  getServer(): McpServer {
    return this.server;
  }

  /**
   * Validate authentication
   */
  async validateAuth(): Promise<boolean> {
    return this.authProvider.validate();
  }
}
