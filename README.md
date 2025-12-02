# Bitbucket MCP Server

[![CI](https://github.com/icy-r/bitbucket-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/icy-r/bitbucket-mcp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@icy-r/bitbucket-mcp.svg)](https://www.npmjs.com/package/@icy-r/bitbucket-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for Bitbucket Cloud and Server integration. This server enables AI agents to interact with Bitbucket repositories, pull requests, pipelines, and more through a standardized MCP interface.

## Features

- **Multiple Authentication Methods**
  - API Tokens (Bitbucket Cloud - recommended)
  - Repository/Workspace/Project Access Tokens
  - OAuth 2.0 with automatic token refresh
  - Basic Auth (Bitbucket Server/Data Center)

- **Comprehensive API Coverage**
  - Workspaces and Projects
  - Repositories (CRUD, fork, source browsing)
  - Pull Requests (create, merge, approve, comment)
  - Branches and Tags
  - Commits and Diffs
  - Pipelines (trigger, monitor, logs)
  - Issues (create, update, comment)
  - Webhooks

- **Production Ready**
  - Retry logic with exponential backoff
  - Rate limit handling
  - Pagination support
  - Comprehensive error handling
  - TypeScript with full type safety

- **AI Agent Optimized**
  - Only 8 consolidated tools (reduced from 54)
  - Action-based design pattern for intuitive usage
  - Clear parameter descriptions for AI understanding
  - **TOON format support for 50-76% token savings**

## Installation

```bash
npm install @icy-r/bitbucket-mcp
```

Or run directly with npx:

```bash
npx @icy-r/bitbucket-mcp
```

## Configuration

Set the following environment variables:

### API Token Authentication (Recommended for Bitbucket Cloud)

> **Important**: As of September 9, 2025, App Passwords can no longer be created. Use API Tokens instead.
> All existing App Passwords will be disabled on June 9, 2026.

API Tokens use **Basic HTTP Authentication** where the username is your Atlassian email and the password is the API token.

```bash
export BITBUCKET_AUTH_METHOD=api_token
export BITBUCKET_USER_EMAIL=your.email@example.com  # Your Atlassian account email
export BITBUCKET_API_TOKEN=your_api_token           # Created at https://bitbucket.org/account/settings/api-tokens/
export BITBUCKET_WORKSPACE=your_workspace           # optional default workspace
```

**Alternative environment variable names (for compatibility):**

```bash
export ATLASSIAN_USER_EMAIL=your.email@example.com
export ATLASSIAN_API_TOKEN=your_api_token
```

**Creating an API Token:**

1. Go to [Bitbucket API Tokens](https://bitbucket.org/account/settings/api-tokens/)
2. Click "Create API token"
3. Give it a name and select the required scopes
4. Set an expiry date (max 1 year)
5. Copy the token - you won't be able to see it again!

### Repository/Workspace/Project Access Tokens

These tokens are scoped to a specific repository, workspace, or project and use Bearer authentication:

```bash
export BITBUCKET_AUTH_METHOD=repository_token  # or workspace_token
export BITBUCKET_API_TOKEN=your_access_token
```

### OAuth 2.0 Authentication

```bash
export BITBUCKET_AUTH_METHOD=oauth
export BITBUCKET_OAUTH_CLIENT_ID=your_client_id
export BITBUCKET_OAUTH_CLIENT_SECRET=your_client_secret
# Or provide an existing access token:
export BITBUCKET_OAUTH_ACCESS_TOKEN=your_access_token
export BITBUCKET_OAUTH_REFRESH_TOKEN=your_refresh_token  # optional
```

### Basic Authentication (Bitbucket Server/Data Center)

```bash
export BITBUCKET_AUTH_METHOD=basic
export BITBUCKET_USERNAME=your_username
export BITBUCKET_PASSWORD=your_password
export BITBUCKET_SERVER_URL=https://bitbucket.yourcompany.com
```

### Additional Configuration

```bash
export BITBUCKET_BASE_URL=https://api.bitbucket.org/2.0  # default
export BITBUCKET_TIMEOUT=30000  # request timeout in ms
export BITBUCKET_MAX_RETRIES=3  # max retry attempts
export BITBUCKET_RETRY_DELAY=1000  # initial retry delay in ms
export BITBUCKET_LOG_LEVEL=info  # debug, info, warn, error
export BITBUCKET_OUTPUT_FORMAT=json  # json, toon, or compact (see Output Formats)
```

## Output Formats (TOON Optimization)

The server supports three output formats to optimize token usage when working with LLMs:

| Format    | Description                                                                | Token Savings |
| --------- | -------------------------------------------------------------------------- | ------------- |
| `json`    | Full JSON output (default, backward compatible)                            | 0%            |
| `toon`    | [TOON format](https://github.com/toon-format/toon) - compact, schema-aware | ~50%          |
| `compact` | Essential fields only in TOON format                                       | ~76%          |

### Setting Output Format

**Global default (environment variable):**

```bash
export BITBUCKET_OUTPUT_FORMAT=compact
```

**Per-request override (parameter):**

```json
{
  "action": "list",
  "workspace": "my-workspace",
  "repo_slug": "my-repo",
  "format": "compact"
}
```

### Example Output Comparison

**JSON format (~100 tokens):**

```json
{
  "id": 123,
  "title": "Add new feature",
  "state": "OPEN",
  "author": {
    "display_name": "John Doe",
    "uuid": "{abc-123}"
  },
  "source": {
    "branch": {
      "name": "feature/new"
    }
  },
  "destination": {
    "branch": {
      "name": "main"
    }
  },
  "created_on": "2024-01-15T10:30:00Z",
  "updated_on": "2024-01-15T11:00:00Z"
}
```

**TOON compact format (~25 tokens):**

```
pullrequests[1]{id,title,state,author.display_name,source.branch.name,destination.branch.name,created_on,updated_on}
123	Add new feature	OPEN	John Doe	feature/new	main	2024-01-15T10:30:00Z	2024-01-15T11:00:00Z
```

### Compact Fields by Resource Type

| Resource     | Compact Fields                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Pull Request | `id`, `title`, `state`, `author.display_name`, `source.branch.name`, `destination.branch.name`, `created_on`, `updated_on` |
| Repository   | `uuid`, `name`, `full_name`, `is_private`, `description`, `language`, `updated_on`                                         |
| Branch       | `name`, `target.hash`, `target.date`, `target.author.raw`                                                                  |
| Commit       | `hash`, `message`, `author.raw`, `date`                                                                                    |
| Issue        | `id`, `title`, `state`, `priority`, `kind`, `assignee.display_name`, `created_on`                                          |
| Pipeline     | `uuid`, `state.name`, `target.ref_name`, `created_on`, `completed_on`                                                      |
| Workspace    | `uuid`, `slug`, `name`                                                                                                     |
| Webhook      | `uuid`, `url`, `description`, `active`, `events`                                                                           |

## Usage with Claude Desktop / Cursor

Add the following to your MCP configuration file:

**Claude Desktop**

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Cursor**

- `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project)

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "npx",
      "args": ["@icy-r/bitbucket-mcp"],
      "env": {
        "BITBUCKET_AUTH_METHOD": "api_token",
        "BITBUCKET_USER_EMAIL": "your.email@example.com",
        "BITBUCKET_API_TOKEN": "your_api_token"
      }
    }
  }
}
```

Or if running from local build:

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["D:\\path\\to\\bitbucket-mcp\\dist\\index.js"],
      "env": {
        "ATLASSIAN_USER_EMAIL": "your.email@example.com",
        "ATLASSIAN_API_TOKEN": "your_api_token"
      }
    }
  }
}
```

## Available Tools (8 Consolidated Tools)

This MCP server uses an **action-based design pattern** to reduce cognitive load for AI agents. Instead of 54 separate tools, we provide 8 consolidated tools with clear action parameters.

### 1. `bitbucket_workspaces`

Manage Bitbucket workspaces.

| Action          | Description                    | Required Parameters |
| --------------- | ------------------------------ | ------------------- |
| `list`          | List all accessible workspaces | -                   |
| `get`           | Get workspace details          | `workspace`         |
| `list_projects` | List projects in a workspace   | `workspace`         |
| `list_members`  | List workspace members         | `workspace`         |

**Example:**

```json
{
  "action": "list_projects",
  "workspace": "my-workspace"
}
```

### 2. `bitbucket_repositories`

Manage Bitbucket repositories.

| Action        | Description                      | Required Parameters              |
| ------------- | -------------------------------- | -------------------------------- |
| `list`        | List repositories in a workspace | `workspace`                      |
| `get`         | Get repository details           | `workspace`, `repo_slug`         |
| `create`      | Create a new repository          | `workspace`, `repo_slug`         |
| `delete`      | Delete a repository              | `workspace`, `repo_slug`         |
| `fork`        | Fork a repository                | `workspace`, `repo_slug`         |
| `get_file`    | Get file content                 | `workspace`, `repo_slug`, `path` |
| `list_source` | List files/directories           | `workspace`, `repo_slug`         |

**Example:**

```json
{
  "action": "get_file",
  "workspace": "my-workspace",
  "repo_slug": "my-repo",
  "path": "README.md",
  "ref": "main"
}
```

### 3. `bitbucket_pull_requests`

Manage Bitbucket pull requests.

| Action          | Description        | Required Parameters                                |
| --------------- | ------------------ | -------------------------------------------------- |
| `list`          | List pull requests | `workspace`, `repo_slug`                           |
| `get`           | Get PR details     | `workspace`, `repo_slug`, `pr_id`                  |
| `create`        | Create a new PR    | `workspace`, `repo_slug`, `title`, `source_branch` |
| `update`        | Update a PR        | `workspace`, `repo_slug`, `pr_id`                  |
| `merge`         | Merge a PR         | `workspace`, `repo_slug`, `pr_id`                  |
| `approve`       | Approve a PR       | `workspace`, `repo_slug`, `pr_id`                  |
| `unapprove`     | Remove approval    | `workspace`, `repo_slug`, `pr_id`                  |
| `decline`       | Decline a PR       | `workspace`, `repo_slug`, `pr_id`                  |
| `list_comments` | List PR comments   | `workspace`, `repo_slug`, `pr_id`                  |
| `add_comment`   | Add comment to PR  | `workspace`, `repo_slug`, `pr_id`, `content`       |
| `get_diff`      | Get PR diff        | `workspace`, `repo_slug`, `pr_id`                  |

**Example:**

```json
{
  "action": "create",
  "workspace": "my-workspace",
  "repo_slug": "my-repo",
  "title": "Add new feature",
  "source_branch": "feature/new-feature",
  "destination_branch": "main"
}
```

### 4. `bitbucket_branches`

Manage Bitbucket branches and tags.

| Action          | Description         | Required Parameters                               |
| --------------- | ------------------- | ------------------------------------------------- |
| `list_branches` | List all branches   | `workspace`, `repo_slug`                          |
| `get_branch`    | Get branch details  | `workspace`, `repo_slug`, `branch_name`           |
| `create_branch` | Create a new branch | `workspace`, `repo_slug`, `branch_name`, `target` |
| `delete_branch` | Delete a branch     | `workspace`, `repo_slug`, `branch_name`           |
| `list_tags`     | List all tags       | `workspace`, `repo_slug`                          |
| `get_tag`       | Get tag details     | `workspace`, `repo_slug`, `tag_name`              |
| `create_tag`    | Create a new tag    | `workspace`, `repo_slug`, `tag_name`, `target`    |

**Example:**

```json
{
  "action": "create_branch",
  "workspace": "my-workspace",
  "repo_slug": "my-repo",
  "branch_name": "feature/new-feature",
  "target": "main"
}
```

### 5. `bitbucket_commits`

View commits and diffs.

| Action         | Description           | Required Parameters                     |
| -------------- | --------------------- | --------------------------------------- |
| `list`         | List commits          | `workspace`, `repo_slug`                |
| `get`          | Get commit details    | `workspace`, `repo_slug`, `commit_hash` |
| `get_diff`     | Get diff between refs | `workspace`, `repo_slug`, `spec`        |
| `get_diffstat` | Get diffstat summary  | `workspace`, `repo_slug`, `spec`        |

**Example:**

```json
{
  "action": "get_diff",
  "workspace": "my-workspace",
  "repo_slug": "my-repo",
  "spec": "main..feature/new-feature"
}
```

### 6. `bitbucket_pipelines`

Manage Bitbucket Pipelines CI/CD.

| Action            | Description              | Required Parameters                                    |
| ----------------- | ------------------------ | ------------------------------------------------------ |
| `list`            | List pipelines           | `workspace`, `repo_slug`                               |
| `get`             | Get pipeline details     | `workspace`, `repo_slug`, `pipeline_uuid`              |
| `trigger`         | Trigger a pipeline       | `workspace`, `repo_slug`, `branch`                     |
| `trigger_custom`  | Trigger custom pipeline  | `workspace`, `repo_slug`, `branch`, `pattern`          |
| `stop`            | Stop a running pipeline  | `workspace`, `repo_slug`, `pipeline_uuid`              |
| `list_steps`      | List pipeline steps      | `workspace`, `repo_slug`, `pipeline_uuid`              |
| `get_step`        | Get step details         | `workspace`, `repo_slug`, `pipeline_uuid`, `step_uuid` |
| `get_logs`        | Get step logs            | `workspace`, `repo_slug`, `pipeline_uuid`, `step_uuid` |
| `get_config`      | Get pipeline config      | `workspace`, `repo_slug`                               |
| `set_enabled`     | Enable/disable pipelines | `workspace`, `repo_slug`, `enabled`                    |
| `list_variables`  | List pipeline variables  | `workspace`, `repo_slug`                               |
| `get_variable`    | Get a variable           | `workspace`, `repo_slug`, `variable_uuid`              |
| `create_variable` | Create a variable        | `workspace`, `repo_slug`, `key`, `value`               |
| `update_variable` | Update a variable        | `workspace`, `repo_slug`, `variable_uuid`              |
| `delete_variable` | Delete a variable        | `workspace`, `repo_slug`, `variable_uuid`              |

**Example:**

```json
{
  "action": "trigger",
  "workspace": "my-workspace",
  "repo_slug": "my-repo",
  "branch": "main"
}
```

### 7. `bitbucket_issues`

Manage Bitbucket issue tracking.

| Action          | Description          | Required Parameters                             |
| --------------- | -------------------- | ----------------------------------------------- |
| `list`          | List issues          | `workspace`, `repo_slug`                        |
| `get`           | Get issue details    | `workspace`, `repo_slug`, `issue_id`            |
| `create`        | Create an issue      | `workspace`, `repo_slug`, `title`               |
| `update`        | Update an issue      | `workspace`, `repo_slug`, `issue_id`            |
| `delete`        | Delete an issue      | `workspace`, `repo_slug`, `issue_id`            |
| `list_comments` | List issue comments  | `workspace`, `repo_slug`, `issue_id`            |
| `add_comment`   | Add comment to issue | `workspace`, `repo_slug`, `issue_id`, `content` |
| `vote`          | Vote for an issue    | `workspace`, `repo_slug`, `issue_id`            |
| `unvote`        | Remove vote          | `workspace`, `repo_slug`, `issue_id`            |
| `watch`         | Watch an issue       | `workspace`, `repo_slug`, `issue_id`            |
| `unwatch`       | Stop watching        | `workspace`, `repo_slug`, `issue_id`            |

**Example:**

```json
{
  "action": "create",
  "workspace": "my-workspace",
  "repo_slug": "my-repo",
  "title": "Bug: Something is broken",
  "content": "Description of the issue",
  "priority": "major",
  "kind": "bug"
}
```

### 8. `bitbucket_webhooks`

Manage Bitbucket webhooks.

| Action             | Description              | Required Parameters                       |
| ------------------ | ------------------------ | ----------------------------------------- |
| `list`             | List repo webhooks       | `workspace`, `repo_slug`                  |
| `get`              | Get webhook details      | `workspace`, `repo_slug`, `webhook_uuid`  |
| `create`           | Create a webhook         | `workspace`, `repo_slug`, `url`, `events` |
| `update`           | Update a webhook         | `workspace`, `repo_slug`, `webhook_uuid`  |
| `delete`           | Delete a webhook         | `workspace`, `repo_slug`, `webhook_uuid`  |
| `list_workspace`   | List workspace webhooks  | `workspace`                               |
| `get_workspace`    | Get workspace webhook    | `workspace`, `webhook_uuid`               |
| `create_workspace` | Create workspace webhook | `workspace`, `url`, `events`              |
| `update_workspace` | Update workspace webhook | `workspace`, `webhook_uuid`               |
| `delete_workspace` | Delete workspace webhook | `workspace`, `webhook_uuid`               |

**Example:**

```json
{
  "action": "create",
  "workspace": "my-workspace",
  "repo_slug": "my-repo",
  "url": "https://example.com/webhook",
  "events": ["repo:push", "pullrequest:created"]
}
```

## Development

### Setup

```bash
git clone https://github.com/icy-r/bitbucket-mcp.git
cd bitbucket-mcp
pnpm install
```

### Build

```bash
pnpm run build
```

### Run in development mode

```bash
pnpm run dev
```

### Run tests

```bash
pnpm test                    # Unit tests
pnpm run test:integration    # Integration tests
pnpm run test:coverage       # Coverage report
```

### Lint and format

```bash
pnpm run lint
pnpm run format
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - The MCP specification
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official TypeScript SDK
- [Bitbucket REST API](https://developer.atlassian.com/cloud/bitbucket/rest/) - Bitbucket API documentation
