#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig, validateAuthConfig } from './config/settings.js';
import { BitbucketMCPServer } from './server.js';
import { logger } from './utils/logger.js';

/**
 * Main entry point for the Bitbucket MCP server
 */
async function main(): Promise<void> {
  try {
    // Load and validate configuration
    const config = loadConfig();
    validateAuthConfig(config);

    // Create server instance
    const bitbucketServer = new BitbucketMCPServer(config);

    // Validate authentication
    const isAuthValid = await bitbucketServer.validateAuth();
    if (!isAuthValid) {
      logger.warn('Authentication validation failed - some operations may not work');
    }

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    const mcpServer = bitbucketServer.getServer();
    await mcpServer.connect(transport);

    logger.info('Bitbucket MCP server started successfully');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down Bitbucket MCP server...');
      await mcpServer.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down Bitbucket MCP server...');
      await mcpServer.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start Bitbucket MCP server', error);
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

