import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock Bitbucket API responses
const handlers = [
  // List workspaces
  http.get('https://api.bitbucket.org/2.0/workspaces', () => {
    return HttpResponse.json({
      size: 1,
      page: 1,
      pagelen: 25,
      values: [
        {
          type: 'workspace',
          uuid: '{workspace-uuid}',
          name: 'Test Workspace',
          slug: 'test-workspace',
          is_private: false,
        },
      ],
    });
  }),

  // Get workspace
  http.get('https://api.bitbucket.org/2.0/workspaces/:workspace', ({ params }) => {
    return HttpResponse.json({
      type: 'workspace',
      uuid: '{workspace-uuid}',
      name: 'Test Workspace',
      slug: params.workspace,
      is_private: false,
    });
  }),

  // List repositories
  http.get('https://api.bitbucket.org/2.0/repositories/:workspace', () => {
    return HttpResponse.json({
      size: 1,
      page: 1,
      pagelen: 25,
      values: [
        {
          type: 'repository',
          uuid: '{repo-uuid}',
          name: 'Test Repo',
          full_name: 'test-workspace/test-repo',
          slug: 'test-repo',
          description: 'A test repository',
          is_private: true,
          scm: 'git',
          created_on: '2024-01-01T00:00:00.000Z',
          updated_on: '2024-01-02T00:00:00.000Z',
        },
      ],
    });
  }),

  // Get repository
  http.get('https://api.bitbucket.org/2.0/repositories/:workspace/:repo', ({ params }) => {
    return HttpResponse.json({
      type: 'repository',
      uuid: '{repo-uuid}',
      name: 'Test Repo',
      full_name: `${params.workspace}/${params.repo}`,
      slug: params.repo,
      description: 'A test repository',
      is_private: true,
      scm: 'git',
      created_on: '2024-01-01T00:00:00.000Z',
      updated_on: '2024-01-02T00:00:00.000Z',
      mainbranch: {
        type: 'branch',
        name: 'main',
      },
    });
  }),

  // List pull requests
  http.get('https://api.bitbucket.org/2.0/repositories/:workspace/:repo/pullrequests', () => {
    return HttpResponse.json({
      size: 1,
      page: 1,
      pagelen: 25,
      values: [
        {
          type: 'pullrequest',
          id: 1,
          title: 'Test PR',
          state: 'OPEN',
          author: {
            type: 'user',
            uuid: '{user-uuid}',
            display_name: 'Test User',
          },
          source: {
            branch: { name: 'feature-branch' },
          },
          destination: {
            branch: { name: 'main' },
          },
          created_on: '2024-01-01T00:00:00.000Z',
          updated_on: '2024-01-02T00:00:00.000Z',
        },
      ],
    });
  }),

  // List branches
  http.get('https://api.bitbucket.org/2.0/repositories/:workspace/:repo/refs/branches', () => {
    return HttpResponse.json({
      size: 2,
      page: 1,
      pagelen: 25,
      values: [
        {
          type: 'branch',
          name: 'main',
          target: {
            type: 'commit',
            hash: 'abc123',
            date: '2024-01-01T00:00:00.000Z',
          },
        },
        {
          type: 'branch',
          name: 'develop',
          target: {
            type: 'commit',
            hash: 'def456',
            date: '2024-01-02T00:00:00.000Z',
          },
        },
      ],
    });
  }),

  // List pipelines
  http.get('https://api.bitbucket.org/2.0/repositories/:workspace/:repo/pipelines', () => {
    return HttpResponse.json({
      size: 1,
      page: 1,
      pagelen: 25,
      values: [
        {
          type: 'pipeline',
          uuid: '{pipeline-uuid}',
          build_number: 1,
          state: {
            type: 'pipeline_state_completed',
            name: 'COMPLETED',
            result: {
              type: 'pipeline_state_completed_result',
              name: 'SUCCESSFUL',
            },
          },
          created_on: '2024-01-01T00:00:00.000Z',
          completed_on: '2024-01-01T00:05:00.000Z',
        },
      ],
    });
  }),
];

// Create MSW server
export const server = setupServer(...handlers);

// Setup hooks
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

