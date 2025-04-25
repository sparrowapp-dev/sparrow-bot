import { Octokit } from '@octokit/rest';
import { logger } from '../utils/logger';

export class GitHubClient {
  private octokit: Octokit;

  constructor(octokit: Octokit) {
    this.octokit = octokit;
  }

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
}
