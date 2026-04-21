# [2.0.0](https://github.com/icy-r/bitbucket-mcp/compare/v1.0.1...v2.0.0) (2026-04-21)


* feat!: fix bugs and improve parameter consistency across tools ([d2b3458](https://github.com/icy-r/bitbucket-mcp/commit/d2b34583e9342900cfaadfa14458d98d9c470971))


### BREAKING CHANGES

* pipeline tool `branch` parameter renamed to `branch_name` for
consistency with branch-tools. Existing callers using `branch` for trigger and
trigger_custom actions must update to `branch_name`.

Tests: added 58 new tests across 9 files (120 tests total, all passing).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>

# 1.0.0 (2025-12-02)


### Bug Fixes

* relax eslint rules for existing codebase ([9c26dee](https://github.com/icy-r/bitbucket-mcp/commit/9c26deec76f1176192510f91d58b3b68528511a0))
* resolve typescript errors for ci ([54af0ff](https://github.com/icy-r/bitbucket-mcp/commit/54af0ffaa0f942ae4827806d2563e59e537bc5ec))
* update tests for new auth validation requirements ([17cf959](https://github.com/icy-r/bitbucket-mcp/commit/17cf95982d56ba50d1ebb17c6ab42e4e08188c98))


### Features

* initial release with semantic-release and ci/cd setup ([1c4aac2](https://github.com/icy-r/bitbucket-mcp/commit/1c4aac2c7fbfff887c2cd78c7ef605c40e59782c))
