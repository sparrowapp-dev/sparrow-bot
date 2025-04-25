import { Octokit } from '@octokit/rest';
import { GitHubClient } from '../../github/github-client';
import { PRTitleConfig } from '../../config/config-loader';
import { logger } from '../../utils/logger';

export function setupPRTitleValidation(octokit: Octokit, config: PRTitleConfig) {
  const githubClient = new GitHubClient(octokit);
  
  return {
    validatePRTitle: async (owner: string, repo: string, prNumber: number, title: string, sha: string) => {
      logger.info(`Validating PR title for ${owner}/${repo}#${prNumber}`);
      
      const result = validateTitle(title, config);
      
      // Update the status check
      await githubClient.createStatus(owner, repo, sha, {
        state: result.valid ? 'success' : 'failure',
        description: result.message,
        context: 'sparrow-bot/pr-title',
      });
      
      // If the title is invalid, add a comment with helpful feedback
      if (!result.valid) {
        const comment = generateHelpfulComment(title, result, config);
        await githubClient.createComment(owner, repo, prNumber, comment);
      }
      
      return result;
    }
  };
}

interface ValidationResult {
  valid: boolean;
  message: string;
  errors?: string[];
}

function validateTitle(title: string, config: PRTitleConfig): ValidationResult {
  const errors: string[] = [];
  
  // Check against each pattern
  const matchesAnyPattern = config.patterns.some(pattern => {
    const regex = new RegExp(pattern);
    return regex.test(title);
  });
  
  if (!matchesAnyPattern) {
    errors.push('Title does not match the required format');
  }
  
  // Extract type from title
  const typeMatch = title.match(/^([a-z]+)(\([a-z-]+\))?!?:/);
  if (typeMatch) {
    const type = typeMatch[1];
    
    // Check if type is allowed
    if (!config.types.includes(type)) {
      errors.push(`Type "${type}" is not allowed. Allowed types: ${config.types.join(', ')}`);
    }
    
    // Extract scope if present
    const scopeMatch = title.match(/^\w+\(([a-z-]+)\)!?:/);
    if (scopeMatch && config.scopes) {
      const scope = scopeMatch[1];
      
      // Check if scope is allowed
      if (!config.scopes.includes(scope)) {
        errors.push(`Scope "${scope}" is not allowed. Allowed scopes: ${config.scopes.join(', ')}`);
      }
    }
  }
  
  // Check if title has a description
  if (!title.match(/^[a-z]+(\([a-z-]+\))?!?: .+/)) {
    errors.push('Title must include a description after the type');
  }
  
  return {
    valid: errors.length === 0,
    message: errors.length === 0 ? 'PR title format is valid' : 'PR title format is invalid',
    errors: errors.length > 0 ? errors : undefined,
  };
}

function generateHelpfulComment(title: string, result: ValidationResult, config: PRTitleConfig): string {
  const errors = result.errors || [];
  
  let comment = `## 🤖 PR Title Validation Failed\n\n`;
  comment += `Your PR title \`${title}\` does not meet our formatting requirements.\n\n`;
  
  comment += `### Errors:\n`;
  errors.forEach(error => {
    comment += `- ${error}\n`;
  });
  
  comment += `\n### Required Format:\n`;
  comment += `\`\`\`\n<type>(<scope>): <description>\n\`\`\`\n\n`;
  
  comment += `### Allowed Types:\n`;
  comment += `\`${config.types.join('`, `')}\`\n\n`;
  
  if (config.scopes) {
    comment += `### Allowed Scopes:\n`;
    comment += `\`${config.scopes.join('`, `')}\`\n\n`;
  }
  
  comment += `### Examples:\n`;
  comment += `- \`feat(ui): add new button component\`\n`;
  comment += `- \`fix(api): resolve authentication issue\`\n`;
  comment += `- \`docs: update README with new instructions\`\n\n`;
  
  comment += `Please update your PR title to match the required format.`;
  
  return comment;
}
