import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import { loadConfig } from './config/config-loader';
import { setupStaleManagement } from './features/stale/stale-manager';
import { setupPRTitleValidation } from './features/pr-title/pr-title-validator';
import { setupLabelManagement } from './features/labels/label-manager';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

async function main() {
  try {
    logger.info('Starting Sparrow Bot...');

    // Initialize GitHub client
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Load configuration
    const config = await loadConfig();

    // Setup features
    setupStaleManagement(octokit, config.stale);
    setupPRTitleValidation(octokit, config.prTitle);
    setupLabelManagement(octokit, config.labels);

    logger.info('Sparrow Bot started successfully');
  } catch (error) {
    logger.error('Failed to start Sparrow Bot', error);
    process.exit(1);
  }
}

main();
