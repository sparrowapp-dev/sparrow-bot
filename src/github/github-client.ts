import { Octokit } from '@octokit/rest';
import { logger } from '../utils/logger';

export class GitHubClient {
  private octokit: Octokit;

  constructor(octokit: Octokit) {
    this.octokit = octokit;
  }

  // Cache for user information to avoid repeated API calls
  private userInfoCache = new Map<string, {
    isFirstTimeContributor: boolean;
    isMaintainer: boolean;
  }>();

  async getIssues(owner: string, repo: string, options: Record<string, unknown> = {}) {
    try {
      logger.debug(`Fetching issues for ${owner}/${repo}`, options);
      const response = await this.octokit.issues.listForRepo({
        owner,
        repo,
        ...options,
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch issues for ${owner}/${repo}`, error);
      throw error;
    }
  }

  async getPullRequests(owner: string, repo: string, options: Record<string, unknown> = {}) {
    try {
      logger.debug(`Fetching pull requests for ${owner}/${repo}`, options);
      const response = await this.octokit.pulls.list({
        owner,
        repo,
        ...options,
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch pull requests for ${owner}/${repo}`, error);
      throw error;
    }
  }

  async addLabels(owner: string, repo: string, issueNumber: number, labels: string[]) {
    try {
      logger.debug(`Adding labels to ${owner}/${repo}#${issueNumber}`, labels);
      const response = await this.octokit.issues.addLabels({
        owner,
        repo,
        issue_number: issueNumber,
        labels,
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to add labels to ${owner}/${repo}#${issueNumber}`, error);
      throw error;
    }
  }

  async removeLabel(owner: string, repo: string, issueNumber: number, label: string) {
    try {
      logger.debug(`Removing label from ${owner}/${repo}#${issueNumber}`, label);
      const response = await this.octokit.issues.removeLabel({
        owner,
        repo,
        issue_number: issueNumber,
        name: label,
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to remove label from ${owner}/${repo}#${issueNumber}`, error);
      throw error;
    }
  }

  async createComment(owner: string, repo: string, issueNumber: number, body: string) {
    try {
      logger.debug(`Creating comment on ${owner}/${repo}#${issueNumber}`);
      const response = await this.octokit.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body,
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to create comment on ${owner}/${repo}#${issueNumber}`, error);
      throw error;
    }
  }

  async closeIssue(owner: string, repo: string, issueNumber: number) {
    try {
      logger.debug(`Closing issue ${owner}/${repo}#${issueNumber}`);
      const response = await this.octokit.issues.update({
        owner,
        repo,
        issue_number: issueNumber,
        state: 'closed',
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to close issue ${owner}/${repo}#${issueNumber}`, error);
      throw error;
    }
  }

  async createStatus(owner: string, repo: string, sha: string, options: {
    state: 'error' | 'failure' | 'pending' | 'success';
    description?: string;
    context?: string;
    target_url?: string;
  }) {
    try {
      logger.debug(`Creating status for ${owner}/${repo}@${sha}`, options);
      const response = await this.octokit.repos.createCommitStatus({
        owner,
        repo,
        sha,
        ...options,
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to create status for ${owner}/${repo}@${sha}`, error);
      throw error;
    }
  }

  async getIssue(owner: string, repo: string, issueNumber: number) {
    try {
      logger.debug(`Fetching issue ${owner}/${repo}#${issueNumber}`);
      const response = await this.octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch issue ${owner}/${repo}#${issueNumber}`, error);
      throw error;
    }
  }

  async getPRFiles(owner: string, repo: string, pullNumber: number) {
    try {
      logger.debug(`Fetching files for PR ${owner}/${repo}#${pullNumber}`);
      const response = await this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
        per_page: 100,
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch files for PR ${owner}/${repo}#${pullNumber}`, error);
      throw error;
    }
  }

  async getUserInfo(owner: string, repo: string, issueNumber: number) {
    try {
      // Create a cache key
      const cacheKey = `${owner}/${repo}/${issueNumber}`;

      // Check if we have cached data
      if (this.userInfoCache.has(cacheKey)) {
        return this.userInfoCache.get(cacheKey)!;
      }

      // Get the issue or PR to find the user
      const issue = await this.getIssue(owner, repo, issueNumber);
      const username = issue.user?.login || 'unknown';

      // Check if the user is a maintainer (has push access)
      let isMaintainer = false;
      try {
        const collaboratorResponse = await this.octokit.repos.getCollaboratorPermissionLevel({
          owner,
          repo,
          username,
        });

        const permission = collaboratorResponse.data.permission;
        isMaintainer = permission === 'admin' || permission === 'write';
      } catch (error) {
        // If we can't get the permission, assume they're not a maintainer
        isMaintainer = false;
      }

      // Check if this is the user's first contribution
      let isFirstTimeContributor = false;
      try {
        // Search for issues and PRs by this user in this repo
        const searchResponse = await this.octokit.search.issuesAndPullRequests({
          q: `repo:${owner}/${repo} author:${username}`,
          per_page: 2, // We only need to know if there's more than one
        });

        // If this is the only item or there are no items, it's their first contribution
        isFirstTimeContributor = searchResponse.data.total_count <= 1;
      } catch (error) {
        // If we can't search, assume it's not their first contribution
        isFirstTimeContributor = false;
      }

      // Cache the result
      const userInfo = { isFirstTimeContributor, isMaintainer };
      this.userInfoCache.set(cacheKey, userInfo);

      return userInfo;
    } catch (error) {
      logger.error(`Failed to get user info for ${owner}/${repo}#${issueNumber}`, error);
      // Return default values if we can't get the info
      return { isFirstTimeContributor: false, isMaintainer: false };
    }
  }
}
