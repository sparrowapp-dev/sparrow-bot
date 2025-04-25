import Ajv from 'ajv';
import { logger } from '../utils/logger';
import { configSchema } from './config-schema';

export interface StaleConfig {
  daysBeforeStale: number;
  daysBeforeClose: number;
  exemptLabels: string[];
  staleLabel: string;
  staleMessage?: string;
  closeMessage?: string;
}

export interface PRTitleConfig {
  types: string[];
  scopes?: string[];
  patterns: string[];
}

export interface LabelConfig {
  categories: Record<string, string[]>;
  autoLabeling: {
    rules: Array<{
      pattern: string;
      labels: string[];
    }>;
  };
}

export interface BotConfig {
  stale: StaleConfig;
  prTitle: PRTitleConfig;
  labels: LabelConfig;
}

const defaultConfig: BotConfig = {
  stale: {
    daysBeforeStale: 60,
    daysBeforeClose: 7,
    exemptLabels: ['pinned', 'security', 'bug'],
    staleLabel: 'stale',
    staleMessage: '🤖 **Sparrow Bot Here!**\n\nThis item has been automatically marked as stale because it hasn\'t had any activity in the last 60 days.\n\n- If this is still relevant, please comment or update it within 7 days.\n- If no activity occurs, this will be automatically closed.\n\nThank you for helping keep our repository organized! 🙏',
    closeMessage: '🤖 **Sparrow Bot Here!**\n\nThis item has been automatically closed due to inactivity.\n\nFeel free to reopen it if you believe it still needs attention.\n\nThank you for your contributions! 🙏',
  },
  prTitle: {
    types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'build', 'ci', 'revert'],
    scopes: ['core', 'api', 'ui', 'docs', 'deps'],
    patterns: ['^(feat|fix|docs|style|refactor|test|chore|build|ci|revert)(\\(\\w+\\))?!?: .+$'],
  },
  labels: {
    categories: {
      'type': ['feature', 'bug', 'enhancement', 'documentation', 'maintenance'],
      'priority': ['critical', 'high', 'medium', 'low'],
      'status': ['in-progress', 'review-needed', 'blocked', 'completed'],
    },
    autoLabeling: {
      rules: [
        {
          pattern: '\\bfix(es|ed)?\\b|\\bbug\\b',
          labels: ['bug'],
        },
        {
          pattern: '\\bdoc(s|umentation)?\\b',
          labels: ['documentation'],
        },
      ],
    },
  },
};

export async function loadConfig(): Promise<BotConfig> {
  try {
    // In a real implementation, this would load from a file or API
    // For now, we'll just return the default config
    logger.info('Loading configuration...');
    
    // Validate the configuration
    const ajv = new Ajv();
    const validate = ajv.compile(configSchema);
    
    if (!validate(defaultConfig)) {
      logger.error('Invalid configuration', validate.errors);
      throw new Error('Invalid configuration');
    }
    
    logger.info('Configuration loaded successfully');
    return defaultConfig;
  } catch (error) {
    logger.error('Failed to load configuration', error);
    throw error;
  }
}
