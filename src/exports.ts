// Export the main features
export { setupStaleManagement } from './features/stale/stale-manager';
export { setupPRTitleValidation } from './features/pr-title/pr-title-validator';
export { setupLabelManagement } from './features/labels/label-manager';
export { setupCodeReviewAssistant } from './features/code-review/code-review-assistant';

// Export types
export { StaleConfig, PRTitleConfig, LabelConfig, CodeReviewConfig } from './config/config-loader';

// Export GitHub client
export { GitHubClient } from './github/github-client';

// Export utilities
export { logger } from './utils/logger';
