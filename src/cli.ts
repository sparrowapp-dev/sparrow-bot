#!/usr/bin/env node

import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import { loadConfig } from './config/config-loader';
import { setupStaleManagement } from './features/stale/stale-manager';
import { setupPRTitleValidation } from './features/pr-title/pr-title-validator';
import { setupLabelManagement } from './features/labels/label-manager';
import { setupCodeReviewAssistant } from './features/code-review/code-review-assistant';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

async function main() {
  try {
    const command = process.argv[2];

    if (!command) {
      console.log('Please provide a command: stale, pr-title, auto-label, sync-labels, code-review');
      process.exit(1);
    }

    // Initialize GitHub client
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Load configuration
    const config = await loadConfig();

    // Get repository information from environment variables
    const owner = process.env.GITHUB_REPOSITORY_OWNER;
    const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];

    if (!owner || !repo) {
      logger.error('Repository information not available');
      process.exit(1);
    }

    // Execute the requested command
    switch (command) {
      case 'stale':
        logger.info('Running stale check');
        const staleManager = setupStaleManagement(octokit, config.stale);
        await staleManager.processStaleItems(owner, repo);
        break;

      case 'pr-title':
        logger.info('Validating PR title');
        const prTitle = process.env.PR_TITLE;
        const prNumber = parseInt(process.env.PR_NUMBER || '0', 10);
        const sha = process.env.COMMIT_SHA;

        if (!prTitle || !prNumber || !sha) {
          logger.error('Missing required environment variables for PR title validation');
          process.exit(1);
        }

        const prTitleValidator = setupPRTitleValidation(octokit, config.prTitle);
        await prTitleValidator.validatePRTitle(owner, repo, prNumber, prTitle, sha);
        break;

      case 'auto-label':
        logger.info('Auto-labeling issue/PR');
        const issueNumber = parseInt(process.env.ISSUE_NUMBER || '0', 10);
        const content = process.env.CONTENT || '';
        const title = process.env.TITLE || '';
        const isPR = process.env.IS_PR === 'true';

        if (!issueNumber) {
          logger.error('Missing required environment variables for auto-labeling');
          process.exit(1);
        }

        const labelManager = setupLabelManagement(octokit, config.labels);
        await labelManager.autoLabelItem(owner, repo, issueNumber, content, title, isPR);
        break;

      case 'sync-labels':
        logger.info('Syncing labels');
        const syncLabelManager = setupLabelManagement(octokit, config.labels);
        await syncLabelManager.syncLabels(owner, repo);
        break;

      case 'code-review':
        logger.info('Reviewing pull request');
        const reviewPrNumber = parseInt(process.env.PR_NUMBER || '0', 10);

        if (!reviewPrNumber) {
          logger.error('Missing required environment variables for code review');
          process.exit(1);
        }

        const codeReviewAssistant = setupCodeReviewAssistant(octokit, config.codeReview);
        await codeReviewAssistant.reviewPullRequest(owner, repo, reviewPrNumber);
        break;

      default:
        logger.error(`Unknown command: ${command}`);
        process.exit(1);
    }

    logger.info('Command executed successfully');
  } catch (error) {
    logger.error('Failed to execute command', error);
    process.exit(1);
  }
}

main();
