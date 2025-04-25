import { Octokit } from '@octokit/rest';
import { GitHubClient } from '../../github/github-client';
import { StaleConfig } from '../../config/config-loader';
import { logger } from '../../utils/logger';

export function setupStaleManagement(octokit: Octokit, config: StaleConfig) {
  const githubClient = new GitHubClient(octokit);

  // This would typically be scheduled to run periodically
  // For now, we'll just define the function
  return {
    processStaleItems: async (owner: string, repo: string) => {
      logger.info(`Processing stale items for ${owner}/${repo}`);

      // Calculate the stale threshold date
      const staleThreshold = new Date();
      staleThreshold.setDate(staleThreshold.getDate() - config.daysBeforeStale);

      // Calculate the close threshold date
      const closeThreshold = new Date();
      closeThreshold.setDate(closeThreshold.getDate() - (config.daysBeforeStale + config.daysBeforeClose));

      // Get all open issues and PRs
      const issues = await githubClient.getIssues(owner, repo, {
        state: 'open',
        per_page: 100,
      });

      // Process each issue/PR
      for (const issue of issues) {
        await processItem(githubClient, owner, repo, issue, staleThreshold, closeThreshold, config);
      }

      logger.info(`Completed processing stale items for ${owner}/${repo}`);
    }
  };
}

async function processItem(
  githubClient: GitHubClient,
  owner: string,
  repo: string,
  issue: any,
  staleThreshold: Date,
  closeThreshold: Date,
  config: StaleConfig
) {
  const issueNumber = issue.number;
  const updatedAt = new Date(issue.updated_at);
  const labels = issue.labels.map((label: any) => label.name);

  // Skip items with exempt labels
  if (labels.some((label: string) => config.exemptLabels.includes(label))) {
    logger.debug(`Skipping ${owner}/${repo}#${issueNumber} due to exempt label`);
    return;
  }

  // Check if the item is already marked as stale
  const isStale = labels.includes(config.staleLabel);

  // If the item is stale and hasn't been updated since the close threshold, close it
  if (isStale && updatedAt < closeThreshold) {
    logger.info(`Closing stale item ${owner}/${repo}#${issueNumber}`);

    // Add a comment before closing
    if (config.closeMessage) {
      await githubClient.createComment(owner, repo, issueNumber, config.closeMessage);
    }

    // Close the issue
    await githubClient.closeIssue(owner, repo, issueNumber);
  }
  // If the item is not stale but hasn't been updated since the stale threshold, mark it as stale
  else if (!isStale && updatedAt < staleThreshold) {
    logger.info(`Marking item ${owner}/${repo}#${issueNumber} as stale`);

    // Add the stale label
    await githubClient.addLabels(owner, repo, issueNumber, [config.staleLabel]);

    // Add a comment
    if (config.staleMessage) {
      await githubClient.createComment(owner, repo, issueNumber, config.staleMessage);
    }
  }
  // If the item is stale but has been updated since the stale threshold, remove the stale label
  else if (isStale && updatedAt >= staleThreshold) {
    logger.info(`Removing stale label from ${owner}/${repo}#${issueNumber}`);

    // Remove the stale label
    await githubClient.removeLabel(owner, repo, issueNumber, config.staleLabel);
  }
}
