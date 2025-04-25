import { setupPRTitleValidation } from './pr-title-validator';
import { PRTitleConfig } from '../../config/config-loader';

// Mock the GitHub client
const mockCreateStatus = jest.fn();
const mockCreateComment = jest.fn();
const mockOctokit = {
  repos: {
    createCommitStatus: mockCreateStatus,
  },
  issues: {
    createComment: mockCreateComment,
  },
} as any;

describe('PR Title Validator', () => {
  const config: PRTitleConfig = {
    types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
    scopes: ['core', 'api', 'ui', 'docs', 'deps'],
    patterns: ['^(feat|fix|docs|style|refactor|test|chore)(\\(\\w+\\))?!?: .+$'],
  };

  const validator = setupPRTitleValidation(mockOctokit, config);

  beforeEach(() => {
    mockCreateStatus.mockClear();
    mockCreateComment.mockClear();
  });

  it('should validate a correct PR title', async () => {
    const result = await validator.validatePRTitle(
      'owner',
      'repo',
      1,
      'feat(ui): add new button component',
      'sha123'
    );

    expect(result.valid).toBe(true);
    expect(result.message).toBe('PR title format is valid');
    expect(mockCreateStatus).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      sha: 'sha123',
      state: 'success',
      description: 'PR title format is valid',
      context: 'sparrow-bot/pr-title',
    });
    expect(mockCreateComment).not.toHaveBeenCalled();
  });

  it('should invalidate a PR title with incorrect type', async () => {
    const result = await validator.validatePRTitle(
      'owner',
      'repo',
      1,
      'feature(ui): add new button component',
      'sha123'
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title does not match the required format');
    expect(mockCreateStatus).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      sha: 'sha123',
      state: 'failure',
      description: 'PR title format is invalid',
      context: 'sparrow-bot/pr-title',
    });
    expect(mockCreateComment).toHaveBeenCalled();
  });

  it('should invalidate a PR title with incorrect scope', async () => {
    const result = await validator.validatePRTitle(
      'owner',
      'repo',
      1,
      'feat(invalid): add new button component',
      'sha123'
    );

    expect(result.valid).toBe(false);
    expect(mockCreateStatus).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      sha: 'sha123',
      state: 'failure',
      description: 'PR title format is invalid',
      context: 'sparrow-bot/pr-title',
    });
    expect(mockCreateComment).toHaveBeenCalled();
  });

  it('should invalidate a PR title without description', async () => {
    const result = await validator.validatePRTitle(
      'owner',
      'repo',
      1,
      'feat(ui):',
      'sha123'
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title must include a description after the type');
    expect(mockCreateStatus).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      sha: 'sha123',
      state: 'failure',
      description: 'PR title format is invalid',
      context: 'sparrow-bot/pr-title',
    });
    expect(mockCreateComment).toHaveBeenCalled();
  });
});
