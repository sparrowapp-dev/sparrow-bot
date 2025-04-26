import { Octokit } from '@octokit/rest';
import { GitHubClient } from '../../github/github-client';
import { CodeReviewConfig } from '../../config/config-loader';
import { logger } from '../../utils/logger';
import { analyzeCodeChanges } from './code-analyzer';
import { generateReviewComments } from './review-generator';

export function setupCodeReviewAssistant(octokit: Octokit, config: CodeReviewConfig) {
  const githubClient = new GitHubClient(octokit);
  
  return {
    /**
     * Analyze a pull request and provide AI-powered code review comments
     */
    reviewPullRequest: async (owner: string, repo: string, prNumber: number) => {
      logger.info(`Reviewing PR ${owner}/${repo}#${prNumber}`);
      
      try {
        // Get the PR details
        const pr = await githubClient.getPullRequest(owner, repo, prNumber);
        
        // Skip if PR is from a bot or if it has the skip-review label
        if (pr.user?.type === 'Bot' || 
            pr.labels.some((label: any) => label.name === config.skipReviewLabel)) {
          logger.info(`Skipping review for PR ${owner}/${repo}#${prNumber} (bot or skip label)`);
          return [];
        }
        
        // Get the PR files
        const files = await githubClient.getPRFiles(owner, repo, prNumber);
        
        // Filter files based on configuration
        const filesToReview = files.filter(file => {
          // Skip files that match exclude patterns
          if (config.excludePatterns && 
              config.excludePatterns.some(pattern => 
                new RegExp(pattern, 'i').test(file.filename))) {
            return false;
          }
          
          // Skip files that are too large
          if (config.maxFileSize && 
              (file.additions + file.deletions) > config.maxFileSize) {
            return false;
          }
          
          // Include only files that match include patterns (if specified)
          if (config.includePatterns && config.includePatterns.length > 0) {
            return config.includePatterns.some(pattern => 
              new RegExp(pattern, 'i').test(file.filename));
          }
          
          return true;
        });
        
        if (filesToReview.length === 0) {
          logger.info(`No files to review for PR ${owner}/${repo}#${prNumber}`);
          return [];
        }
        
        // Get the file contents and diffs
        const fileDetails = await Promise.all(filesToReview.map(async file => {
          const content = await githubClient.getFileContent(owner, repo, file.filename, pr.head.sha);
          return {
            filename: file.filename,
            content,
            patch: file.patch || '',
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes
          };
        }));
        
        // Analyze the code changes
        const analysisResults = await analyzeCodeChanges(fileDetails, config);
        
        // Generate review comments
        const reviewComments = await generateReviewComments(analysisResults, config);
        
        // Post the review comments
        if (reviewComments.length > 0) {
          if (config.createReview) {
            // Create a single review with all comments
            await githubClient.createReview(owner, repo, prNumber, {
              body: config.reviewHeader || 'AI-powered code review suggestions:',
              event: 'COMMENT',
              comments: reviewComments.map(comment => ({
                path: comment.path,
                position: comment.position,
                body: comment.body
              }))
            });
            
            logger.info(`Created review with ${reviewComments.length} comments for PR ${owner}/${repo}#${prNumber}`);
          } else {
            // Create individual review comments
            for (const comment of reviewComments) {
              await githubClient.createReviewComment(owner, repo, prNumber, {
                body: comment.body,
                path: comment.path,
                position: comment.position,
                commit_id: pr.head.sha
              });
            }
            
            logger.info(`Added ${reviewComments.length} review comments to PR ${owner}/${repo}#${prNumber}`);
          }
        } else {
          logger.info(`No review comments generated for PR ${owner}/${repo}#${prNumber}`);
        }
        
        return reviewComments;
      } catch (error) {
        logger.error(`Error reviewing PR ${owner}/${repo}#${prNumber}`, error);
        throw error;
      }
    }
  };
}
