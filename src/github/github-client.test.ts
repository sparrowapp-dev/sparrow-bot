import { GitHubClient } from './github-client';

// Mock the Octokit client
const mockListForRepo = jest.fn();
const mockAddLabels = jest.fn();
const mockRemoveLabel = jest.fn();
const mockCreateComment = jest.fn();
const mockUpdate = jest.fn();
const mockCreateCommitStatus = jest.fn();

const mockOctokit = {
  issues: {
    listForRepo: mockListForRepo,
    addLabels: mockAddLabels,
    removeLabel: mockRemoveLabel,
    createComment: mockCreateComment,
    update: mockUpdate,
  },
  repos: {
    createCommitStatus: mockCreateCommitStatus,
  },
} as any;

describe('GitHubClient', () => {
  let client: GitHubClient;

  beforeEach(() => {
    client = new GitHubClient(mockOctokit);
    
    // Clear all mocks
    mockListForRepo.mockClear();
    mockAddLabels.mockClear();
    mockRemoveLabel.mockClear();
    mockCreateComment.mockClear();
    mockUpdate.mockClear();
    mockCreateCommitStatus.mockClear();
  });

  it('should get issues', async () => {
    const mockResponse = {
      data: [{ id: 1, title: 'Test Issue' }],
    };
    mockListForRepo.mockResolvedValueOnce(mockResponse);

    const result = await client.getIssues('owner', 'repo', { state: 'open' });

    expect(mockListForRepo).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      state: 'open',
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('should add labels', async () => {
    const mockResponse = {
      data: { id: 1, labels: [{ name: 'bug' }] },
    };
    mockAddLabels.mockResolvedValueOnce(mockResponse);

    const result = await client.addLabels('owner', 'repo', 1, ['bug']);

    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      labels: ['bug'],
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('should remove a label', async () => {
    const mockResponse = {
      data: { id: 1, labels: [] },
    };
    mockRemoveLabel.mockResolvedValueOnce(mockResponse);

    const result = await client.removeLabel('owner', 'repo', 1, 'bug');

    expect(mockRemoveLabel).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      name: 'bug',
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('should create a comment', async () => {
    const mockResponse = {
      data: { id: 1, body: 'Test comment' },
    };
    mockCreateComment.mockResolvedValueOnce(mockResponse);

    const result = await client.createComment('owner', 'repo', 1, 'Test comment');

    expect(mockCreateComment).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      body: 'Test comment',
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('should close an issue', async () => {
    const mockResponse = {
      data: { id: 1, state: 'closed' },
    };
    mockUpdate.mockResolvedValueOnce(mockResponse);

    const result = await client.closeIssue('owner', 'repo', 1);

    expect(mockUpdate).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      state: 'closed',
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('should create a status', async () => {
    const mockResponse = {
      data: { id: 1, state: 'success' },
    };
    mockCreateCommitStatus.mockResolvedValueOnce(mockResponse);

    const result = await client.createStatus('owner', 'repo', 'sha', {
      state: 'success',
      description: 'Tests passed',
      context: 'ci/tests',
    });

    expect(mockCreateCommitStatus).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      sha: 'sha',
      state: 'success',
      description: 'Tests passed',
      context: 'ci/tests',
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('should handle errors when getting issues', async () => {
    const error = new Error('API error');
    mockListForRepo.mockRejectedValueOnce(error);

    await expect(client.getIssues('owner', 'repo')).rejects.toThrow(error);
  });
});
