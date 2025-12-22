# Bitbucket MCP

[![npm version](https://img.shields.io/npm/v/@icy-r/bitbucket-mcp.svg)](https://www.npmjs.com/package/@icy-r/bitbucket-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for Bitbucket Cloud. Enables AI assistants to manage repositories, pull requests, pipelines, and more.

## Installation

### Option 1: Using npx (Recommended)

No installation required. Run directly:

```bash
npx @icy-r/bitbucket-mcp
```

### Option 2: Global Installation

```bash
npm install -g @icy-r/bitbucket-mcp
bitbucket-mcp
```

### Option 3: Local Development

```bash
git clone https://github.com/icy-r/bitbucket-mcp.git
cd bitbucket-mcp
pnpm install
pnpm build
node dist/index.js
```

## MCP Client Configuration

### Cursor IDE

Add to your Cursor MCP settings (`~/.cursor/mcp.json` on Windows: `%USERPROFILE%\.cursor\mcp.json`):

**Using npx (Recommended):**

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "npx",
      "args": ["-y", "@icy-r/bitbucket-mcp"],
      "env": {
        "BITBUCKET_AUTH_METHOD": "api_token",
        "BITBUCKET_USER_EMAIL": "your.email@example.com",
        "BITBUCKET_API_TOKEN": "your_api_token"
      }
    }
  }
}
```

**Using local build:**

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["D:\\path\\to\\bitbucket-mcp\\dist\\index.js"],
      "env": {
        "BITBUCKET_AUTH_METHOD": "api_token",
        "BITBUCKET_USER_EMAIL": "your.email@example.com",
        "BITBUCKET_API_TOKEN": "your_api_token"
      }
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "npx",
      "args": ["-y", "@icy-r/bitbucket-mcp"],
      "env": {
        "BITBUCKET_AUTH_METHOD": "api_token",
        "BITBUCKET_USER_EMAIL": "your.email@example.com",
        "BITBUCKET_API_TOKEN": "your_api_token"
      }
    }
  }
}
```

### Other MCP Clients

The server follows the MCP standard and works with any compatible client. Use the configuration pattern above, adjusting paths as needed for your platform.

## Authentication

### API Token (Recommended)

1. Go to [Bitbucket API Tokens](https://bitbucket.org/account/settings/api-tokens/)
2. Create a new token with the required permissions
3. Set the environment variables:

```bash
BITBUCKET_AUTH_METHOD=api_token
BITBUCKET_USER_EMAIL=your.email@example.com
BITBUCKET_API_TOKEN=your_api_token
```

### App Password

1. Go to [Bitbucket App Passwords](https://bitbucket.org/account/settings/app-passwords/)
2. Create a new app password with required permissions
3. Use `basic` auth method with your username and app password

## Environment Variables

| Variable                  | Description                   | Required       |
| ------------------------- | ----------------------------- | -------------- |
| `BITBUCKET_AUTH_METHOD`   | `api_token`, `oauth`, `basic` | Yes            |
| `BITBUCKET_USER_EMAIL`    | Your Atlassian email          | For api_token  |
| `BITBUCKET_API_TOKEN`     | API token                     | For api_token  |
| `BITBUCKET_USERNAME`      | Bitbucket username            | For basic auth |
| `BITBUCKET_APP_PASSWORD`  | App password                  | For basic auth |
| `BITBUCKET_WORKSPACE`     | Default workspace             | No             |
| `BITBUCKET_OUTPUT_FORMAT` | `json`, `toon`, `compact`     | No             |

## Available Tools

| Tool                      | Actions                                                                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bitbucket_workspaces`    | list, get, list_projects, list_members                                                                                                                                             |
| `bitbucket_repositories`  | list, get, create, delete, fork, get_file, list_source                                                                                                                             |
| `bitbucket_pull_requests` | list, get, create, update, merge, approve, unapprove, decline, list_comments, add_comment, get_diff                                                                                |
| `bitbucket_branches`      | list_branches, get_branch, create_branch, delete_branch, list_tags, get_tag, create_tag                                                                                            |
| `bitbucket_commits`       | list, get, get_diff, get_diffstat                                                                                                                                                  |
| `bitbucket_pipelines`     | list, get, trigger, trigger_custom, stop, list_steps, get_step, get_logs, get_config, set_enabled, list_variables, get_variable, create_variable, update_variable, delete_variable |
| `bitbucket_issues`        | list, get, create, update, delete, list_comments, add_comment, vote, unvote, watch, unwatch                                                                                        |
| `bitbucket_webhooks`      | list, get, create, update, delete, list_workspace, get_workspace, create_workspace, update_workspace, delete_workspace                                                             |

## Output Formats

Control response verbosity with the `format` parameter:

| Format    | Description           | Token Savings |
| --------- | --------------------- | ------------- |
| `json`    | Full JSON output      | 0%            |
| `toon`    | Compact TOON format   | ~50%          |
| `compact` | Essential fields only | ~76%          |

Example usage:

```json
{ "action": "list", "workspace": "my-workspace", "format": "compact" }
```

## Examples

### List repositories in a workspace

```json
{
  "action": "list",
  "workspace": "my-workspace"
}
```

### Create a pull request

```json
{
  "action": "create",
  "workspace": "my-workspace",
  "repo_slug": "my-repo",
  "title": "Feature: Add new functionality",
  "source_branch": "feature/new-feature",
  "destination_branch": "main"
}
```

### Trigger a pipeline

```json
{
  "action": "trigger",
  "workspace": "my-workspace",
  "repo_slug": "my-repo",
  "branch": "main"
}
```

## Development

```bash
# Clone the repository
git clone https://github.com/icy-r/bitbucket-mcp.git
cd bitbucket-mcp

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run in development mode (watch)
pnpm dev

# Lint and format
pnpm lint
pnpm format
```

## Requirements

- Node.js >= 20.0.0
- pnpm (for development)

## License

MIT
