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
    
    autoLabelItem: async (owner: string, repo: string, issueNumber: number, content: string) => {
      logger.info(`Auto-labeling item ${owner}/${repo}#${issueNumber}`);
      
      const labelsToAdd: string[] = [];
      
      // Check each rule
      for (const rule of config.autoLabeling.rules) {
        const regex = new RegExp(rule.pattern, 'i');
        
        if (regex.test(content)) {
          // Add the labels for this rule
          labelsToAdd.push(...rule.labels);
        }
      }
      
      // Remove duplicates
      const uniqueLabels = [...new Set(labelsToAdd)];
      
      if (uniqueLabels.length > 0) {
        // Add the labels to the issue/PR
        await githubClient.addLabels(owner, repo, issueNumber, uniqueLabels);
        logger.info(`Added labels ${uniqueLabels.join(', ')} to ${owner}/${repo}#${issueNumber}`);
      }
      
      return uniqueLabels;
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
