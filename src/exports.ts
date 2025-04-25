// Export the main features
export { setupStaleManagement } from './features/stale/stale-manager';
export { setupPRTitleValidation } from './features/pr-title/pr-title-validator';
export { setupLabelManagement } from './features/labels/label-manager';

// Export types
export { StaleConfig, PRTitleConfig, LabelConfig } from './config/config-loader';

// Export GitHub client
export { GitHubClient } from './github/github-client';

// Export utilities
export { logger } from './utils/logger';
