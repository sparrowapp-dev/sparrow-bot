import { setupLabelManagement } from './label-manager';
import { LabelConfig } from '../../config/config-loader';

// Mock the GitHub client
const mockListLabels = jest.fn();
const mockCreateLabel = jest.fn();
const mockAddLabels = jest.fn();
const mockOctokit = {
  issues: {
    listLabelsForRepo: mockListLabels,
    createLabel: mockCreateLabel,
    addLabels: mockAddLabels,
  },
} as any;

describe('Label Manager', () => {
  const config: LabelConfig = {
    categories: {
      type: ['feature', 'bug', 'enhancement'],
      priority: ['high', 'medium', 'low'],
    },
    autoLabeling: {
      rules: [
        {
          pattern: '\\bfix(es|ed)?\\b|\\bbug\\b',
          labels: ['bug'],
        },
        {
          pattern: '\\bfeature\\b',
          labels: ['feature'],
        },
      ],
    },
  };

  const labelManager = setupLabelManagement(mockOctokit, config);

  beforeEach(() => {
    mockListLabels.mockClear();
    mockCreateLabel.mockClear();
    mockAddLabels.mockClear();
  });

  it('should sync labels to a repository', async () => {
    mockListLabels.mockResolvedValueOnce({
      data: [
        { name: 'feature', color: 'fbca04' },
        { name: 'priority: high', color: 'e11d21' },
      ],
    });

    await labelManager.syncLabels('owner', 'repo');

    // Should create labels that don't exist
    expect(mockCreateLabel).toHaveBeenCalledTimes(4); // bug, enhancement, priority: medium, priority: low
    expect(mockCreateLabel).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      name: 'bug',
      color: 'fbca04',
      description: 'Label for bug',
    });
    expect(mockCreateLabel).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      name: 'enhancement',
      color: 'fbca04',
      description: 'Label for enhancement',
    });
    expect(mockCreateLabel).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      name: 'priority: medium',
      color: 'e11d21',
      description: 'Label for priority: medium',
    });
    expect(mockCreateLabel).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      name: 'priority: low',
      color: 'e11d21',
      description: 'Label for priority: low',
    });
  });

  it('should auto-label an issue based on content', async () => {
    const content = 'This is a bug that needs to be fixed';

    const labels = await labelManager.autoLabelItem('owner', 'repo', 1, content);

    expect(labels).toEqual(['bug']);
    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      labels: ['bug'],
    });
  });

  it('should auto-label with multiple labels if content matches multiple rules', async () => {
    const content = 'This is a bug in the feature';

    const labels = await labelManager.autoLabelItem('owner', 'repo', 1, content);

    expect(labels).toEqual(['bug', 'feature']);
    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      labels: ['bug', 'feature'],
    });
  });

  it('should not add any labels if content does not match any rules', async () => {
    const content = 'This is a general comment';

    const labels = await labelManager.autoLabelItem('owner', 'repo', 1, content);

    expect(labels).toEqual([]);
    expect(mockAddLabels).not.toHaveBeenCalled();
  });
});
