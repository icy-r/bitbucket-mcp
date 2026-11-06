# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bitbucket MCP is a Model Context Protocol server (`@icy-r/bitbucket-mcp`) that enables AI assistants to interact with Bitbucket Cloud and Server/Data Center. It exposes 8 consolidated MCP tools (71 total actions) covering workspaces, repositories, pull requests, branches, commits, pipelines, issues, and webhooks.

## Commands

| Command                 | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `pnpm build`            | Compile TypeScript via tsup (ESM + declarations) |
| `pnpm dev`              | Watch mode build                                 |
| `pnpm start`            | Run the built server (`node dist/index.js`)      |
| `pnpm test`             | Run unit tests (vitest)                          |
| `pnpm test:watch`       | Unit tests in watch mode                         |
| `pnpm test:coverage`    | Unit tests with coverage (text, json, html)      |
| `pnpm test:integration` | Integration tests (separate vitest config)       |
| `pnpm lint`             | ESLint on src/\*.ts                              |
| `pnpm lint:fix`         | ESLint auto-fix                                  |
| `pnpm format`           | Prettier formatting                              |
| `pnpm typecheck`        | TypeScript type checking (no emit)               |

Run a single test file: `pnpm vitest run tests/unit/auth/api-token.test.ts`

## Architecture

**Entry flow:** `src/index.ts` (CLI) → loads config via Zod validation → validates auth → creates `BitbucketMCPServer` → connects via StdioServerTransport.

**Key layers:**

- **`src/server.ts`** — `BitbucketMCPServer` orchestrates all tool registrations. Each of the 8 tools is a single MCP tool with an `action` enum parameter (e.g., `bitbucket_pull_requests` supports 13 actions like list, get, create, merge, approve).
- **`src/tools/`** — Tool registration files. Each receives `McpServer`, `BitbucketClient`, and `Config`, creates an endpoint API instance, registers the tool with a Zod schema, and dispatches on `action`.
- **`src/api/client.ts`** — `BitbucketClient` wraps `fetch` with retry logic (exponential backoff), rate limit handling (429 + Retry-After), timeout support, and auth header injection.
- **`src/api/endpoints/`** — Typed API classes (one per resource) that build Bitbucket REST paths and delegate HTTP calls to `BitbucketClient`.
- **`src/auth/`** — Factory pattern (`createAuthProvider`) supporting 5 auth methods: API token (Basic), OAuth2, basic auth, repository token (Bearer), workspace token (Bearer). All implement `AuthProvider` interface.
- **`src/config/settings.ts`** — Zod schema for all config. Loads from env vars (`BITBUCKET_*` or `ATLASSIAN_*` prefix).
- **`src/utils/output-formatter.ts`** — Three output formats: `json` (full), `toon` (~50-70% token savings via @toon-format/toon), `compact` (~76% savings using predefined field sets from `compact-fields.ts`).

**Error hierarchy:** `BitbucketMCPError` → `AuthenticationError` (401), `AuthorizationError` (403), `NotFoundError` (404), `RateLimitError` (429), `ValidationError` (400), `ConfigurationError`.

## Code Conventions

- **ES Modules** — `"type": "module"` throughout. Use ESM imports.
- **Strict TypeScript** — `strict: true`, unused vars/params flagged, no implicit any.
- **Formatting** — Single quotes, semicolons, trailing commas (es5), 100 char print width, 2-space indent, LF line endings.
- **Commits** — Conventional commits enforced via commitlint (`feat:`, `fix:`, `chore:`, etc.). Semantic release auto-publishes.
- **Unused var prefix** — Variables prefixed with `_` are allowed by ESLint.

## Testing

- **Unit tests** in `tests/unit/` — config via `vitest.config.ts`, 10s timeout.
- **Integration tests** in `tests/integration/` — config via `vitest.integration.config.ts`, uses MSW (Mock Service Worker) for HTTP mocking (`tests/integration/setup.ts`).
- Coverage provider: v8.

## Environment Configuration

See `.env.example`. Key variables: `BITBUCKET_AUTH_METHOD`, `BITBUCKET_API_TOKEN`, `BITBUCKET_USER_EMAIL`, `BITBUCKET_BASE_URL`, `BITBUCKET_OUTPUT_FORMAT`, `BITBUCKET_TIMEOUT`, `BITBUCKET_MAX_RETRIES`, `BITBUCKET_LOG_LEVEL`.
