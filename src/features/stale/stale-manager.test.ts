import { setupStaleManagement } from './stale-manager';
import { StaleConfig } from '../../config/config-loader';

// Mock the GitHub client
const mockGetIssues = jest.fn();
const mockAddLabels = jest.fn();
const mockRemoveLabel = jest.fn();
const mockCreateComment = jest.fn();
const mockCloseIssue = jest.fn();
const mockOctokit = {
  issues: {
    listForRepo: mockGetIssues,
    addLabels: mockAddLabels,
    removeLabel: mockRemoveLabel,
    createComment: mockCreateComment,
    update: mockCloseIssue,
  },
} as any;

describe('Stale Manager', () => {
  const config: StaleConfig = {
    daysBeforeStale: 60,
    daysBeforeClose: 7,
    exemptLabels: ['pinned', 'security', 'bug'],
    staleLabel: 'stale',
    staleMessage: 'This is stale',
    closeMessage: 'This is closed',
  };

  const staleManager = setupStaleManagement(mockOctokit, config);

  beforeEach(() => {
    mockGetIssues.mockClear();
    mockAddLabels.mockClear();
    mockRemoveLabel.mockClear();
    mockCreateComment.mockClear();
    mockCloseIssue.mockClear();
  });

  it('should mark an issue as stale if it is old enough', async () => {
    // Create a date that is older than the stale threshold
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - (config.daysBeforeStale + 1));

    mockGetIssues.mockResolvedValueOnce({
      data: [
        {
          number: 1,
          updated_at: staleDate.toISOString(),
          labels: [],
        },
      ],
    });

    await staleManager.processStaleItems('owner', 'repo');

    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      labels: ['stale'],
    });
    expect(mockCreateComment).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      body: 'This is stale',
    });
  });

  it('should close an issue if it is stale and old enough', async () => {
    // Create a date that is older than the close threshold
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() - (config.daysBeforeStale + config.daysBeforeClose + 1));

    mockGetIssues.mockResolvedValueOnce({
      data: [
        {
          number: 1,
          updated_at: closeDate.toISOString(),
          labels: [{ name: 'stale' }],
        },
      ],
    });

    await staleManager.processStaleItems('owner', 'repo');

    expect(mockCreateComment).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      body: 'This is closed',
    });
    expect(mockCloseIssue).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      state: 'closed',
    });
  });

  it('should remove the stale label if an issue is updated', async () => {
    // Create a date that is newer than the stale threshold
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - (config.daysBeforeStale - 1));

    mockGetIssues.mockResolvedValueOnce({
      data: [
        {
          number: 1,
          updated_at: recentDate.toISOString(),
          labels: [{ name: 'stale' }],
        },
      ],
    });

    await staleManager.processStaleItems('owner', 'repo');

    expect(mockRemoveLabel).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      name: 'stale',
    });
  });

  it('should skip issues with exempt labels', async () => {
    // Create a date that is older than the stale threshold
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - (config.daysBeforeStale + 1));

    mockGetIssues.mockResolvedValueOnce({
      data: [
        {
          number: 1,
          updated_at: staleDate.toISOString(),
          labels: [{ name: 'pinned' }],
        },
      ],
    });

    await staleManager.processStaleItems('owner', 'repo');

    expect(mockAddLabels).not.toHaveBeenCalled();
    expect(mockCreateComment).not.toHaveBeenCalled();
  });
});
