import { Octokit } from '@octokit/rest';
import { GitHubClient } from '../../github/github-client';
import { LabelConfig } from '../../config/config-loader';
import { logger } from '../../utils/logger';

export function setupLabelManagement(octokit: Octokit, config: LabelConfig) {
  const githubClient = new GitHubClient(octokit);

  return {
    syncLabels: async (owner: string, repo: string) => {
      logger.info(`Syncing labels for ${owner}/${repo}`);

      // Get all labels from the repository
      const labels = await getRepositoryLabels(octokit, owner, repo);

      // Create a map of existing labels
      const existingLabels = new Map(labels.map(label => [label.name, label]));

      // Process each category of labels
      for (const [category, categoryLabels] of Object.entries(config.categories)) {
        for (const labelName of categoryLabels) {
          const fullLabelName = category === 'type' ? labelName : `${category}: ${labelName}`;

          // Check if the label already exists
          if (!existingLabels.has(fullLabelName)) {
            // Create the label
            await createLabel(octokit, owner, repo, fullLabelName, getLabelColor(category));
            logger.info(`Created label "${fullLabelName}" in ${owner}/${repo}`);
          }
        }
      }

      logger.info(`Completed syncing labels for ${owner}/${repo}`);
    },

    autoLabelItem: async (owner: string, repo: string, issueNumber: number, content: string, title?: string, isPR: boolean = false) => {
      logger.info(`Auto-labeling item ${owner}/${repo}#${issueNumber}`);

      // Get the current labels on the issue/PR
      const item = await githubClient.getIssue(owner, repo, issueNumber);
      const currentLabels = item.labels.map((label: any) => label.name);

      // Store labels to add with their priorities
      const labelCandidates: Array<{ label: string; priority: number }> = [];

      // Process content-based rules
      for (const rule of config.autoLabeling.rules) {
        const regex = new RegExp(rule.pattern, 'i');
        const scope = rule.scope || 'both';
        const priority = rule.priority || 1;

        // Check if we should apply this rule based on conditions
        if (rule.conditions) {
          // Skip if any excluded labels are present
          if (rule.conditions.excludeLabels &&
              rule.conditions.excludeLabels.some(label => currentLabels.includes(label))) {
            continue;
          }

          // Skip if user type conditions don't match
          if (rule.conditions.userTypes) {
            const userInfo = await githubClient.getUserInfo(owner, repo, issueNumber);

            if (rule.conditions.userTypes.firstTimeContributor && !userInfo.isFirstTimeContributor) {
              continue;
            }

            if (rule.conditions.userTypes.maintainer && !userInfo.isMaintainer) {
              continue;
            }
          }
        }

        // Check content based on scope
        let shouldApplyRule = false;

        if (scope === 'body' || scope === 'both') {
          shouldApplyRule = regex.test(content);
        }

        if (!shouldApplyRule && title && (scope === 'title' || scope === 'both')) {
          shouldApplyRule = regex.test(title);
        }

        if (shouldApplyRule) {
          // Add the labels for this rule with their priority
          for (const label of rule.labels) {
            labelCandidates.push({ label, priority });
          }
        }
      }

      // Process file-based rules for PRs
      if (isPR && config.autoLabeling.fileBased) {
        const prFiles = await githubClient.getPRFiles(owner, repo, issueNumber);

        for (const rule of config.autoLabeling.fileBased.rules) {
          const filePatterns = rule.filePatterns.map(pattern => new RegExp(pattern, 'i'));

          // Check if any files match the patterns
          const hasMatchingFile = prFiles.some((file: { filename: string }) =>
            filePatterns.some(pattern => pattern.test(file.filename))
          );

          if (hasMatchingFile) {
            // Add the labels for this rule with default priority
            for (const label of rule.labels) {
              labelCandidates.push({ label, priority: 1 });
            }
          }
        }
      }

      // Process size-based labeling for PRs
      if (isPR && config.autoLabeling.sizeBased && config.autoLabeling.sizeBased.enabled) {
        const prFiles = await githubClient.getPRFiles(owner, repo, issueNumber);
        const totalChanges = prFiles.reduce((sum: number, file: { additions: number; deletions: number }) =>
          sum + file.additions + file.deletions, 0);

        const { thresholds, labels } = config.autoLabeling.sizeBased;
        let sizeLabel = labels.extraLarge; // Default to extra large

        if (totalChanges <= thresholds.small) {
          sizeLabel = labels.small;
        } else if (totalChanges <= thresholds.medium) {
          sizeLabel = labels.medium;
        } else if (totalChanges <= thresholds.large) {
          sizeLabel = labels.large;
        }

        labelCandidates.push({ label: sizeLabel, priority: 1 });
      }

      // Process contributor-based labeling
      if (config.autoLabeling.contributorBased && config.autoLabeling.contributorBased.enabled) {
        const userInfo = await githubClient.getUserInfo(owner, repo, issueNumber);

        if (userInfo.isFirstTimeContributor) {
          labelCandidates.push({
            label: config.autoLabeling.contributorBased.labels.firstTimeContributor,
            priority: 1
          });
        }

        if (userInfo.isMaintainer) {
          labelCandidates.push({
            label: config.autoLabeling.contributorBased.labels.maintainer,
            priority: 1
          });
        }
      }

      // Sort by priority (higher priority first) and remove duplicates
      const sortedCandidates = labelCandidates.sort((a, b) => b.priority - a.priority);
      const uniqueLabels = [...new Set(sortedCandidates.map(candidate => candidate.label))];

      // Filter out labels that are already applied
      const labelsToAdd = uniqueLabels.filter(label => !currentLabels.includes(label));

      if (labelsToAdd.length > 0) {
        // Add the labels to the issue/PR
        await githubClient.addLabels(owner, repo, issueNumber, labelsToAdd);
        logger.info(`Added labels ${labelsToAdd.join(', ')} to ${owner}/${repo}#${issueNumber}`);
      }

      return labelsToAdd;
    }
  };
}

async function getRepositoryLabels(octokit: Octokit, owner: string, repo: string) {
  try {
    const response = await octokit.issues.listLabelsForRepo({
      owner,
      repo,
      per_page: 100,
    });

    return response.data;
  } catch (error) {
    logger.error(`Failed to get labels for ${owner}/${repo}`, error);
    throw error;
  }
}

async function createLabel(octokit: Octokit, owner: string, repo: string, name: string, color: string) {
  try {
    await octokit.issues.createLabel({
      owner,
      repo,
      name,
      color,
      description: `Label for ${name}`,
    });
  } catch (error) {
    logger.error(`Failed to create label ${name} in ${owner}/${repo}`, error);
    throw error;
  }
}

function getLabelColor(category: string): string {
  // Return a color based on the category
  switch (category) {
    case 'type':
      return 'fbca04'; // yellow
    case 'priority':
      return 'e11d21'; // red
    case 'status':
      return '0e8a16'; // green
    default:
      return '5319e7'; // purple
  }
}
