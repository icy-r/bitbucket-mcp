# Bitbucket MCP

[![npm version](https://img.shields.io/npm/v/@icy-r/bitbucket-mcp.svg)](https://www.npmjs.com/package/@icy-r/bitbucket-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for Bitbucket Cloud. Enables AI assistants to manage repositories, pull requests, pipelines, and more.

## Quick Start

```bash
npx @icy-r/bitbucket-mcp
```

## MCP Configuration

Add to your MCP client (Claude Desktop, Cursor, etc.):

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

**Get your API token:** [Bitbucket API Tokens](https://bitbucket.org/account/settings/api-tokens/)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BITBUCKET_AUTH_METHOD` | `api_token`, `oauth`, `basic` | Yes |
| `BITBUCKET_USER_EMAIL` | Your Atlassian email | For api_token |
| `BITBUCKET_API_TOKEN` | API token | For api_token |
| `BITBUCKET_WORKSPACE` | Default workspace | No |
| `BITBUCKET_OUTPUT_FORMAT` | `json`, `toon`, `compact` | No |

## Tools

| Tool | Actions |
|------|---------|
| `bitbucket_workspaces` | list, get, list_projects, list_members |
| `bitbucket_repositories` | list, get, create, delete, fork, get_file |
| `bitbucket_pull_requests` | list, get, create, merge, approve, decline |
| `bitbucket_branches` | list_branches, create_branch, delete_branch, list_tags |
| `bitbucket_commits` | list, get, get_diff, get_diffstat |
| `bitbucket_pipelines` | list, get, trigger, stop, get_logs |
| `bitbucket_issues` | list, get, create, update, delete |
| `bitbucket_webhooks` | list, get, create, update, delete |

## Output Formats

| Format | Description | Token Savings |
|--------|-------------|---------------|
| `json` | Full JSON output | 0% |
| `toon` | Compact TOON format | ~50% |
| `compact` | Essential fields only | ~76% |

```json
{ "action": "list", "workspace": "my-workspace", "format": "compact" }
```

## Development

```bash
git clone https://github.com/icy-r/bitbucket-mcp.git
cd bitbucket-mcp
pnpm install
pnpm build
pnpm test
```

## License

MIT
