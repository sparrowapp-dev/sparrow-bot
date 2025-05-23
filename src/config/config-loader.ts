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
      scope?: 'title' | 'body' | 'both';
      priority?: number;
      conditions?: {
        filePatterns?: string[];
        sizeThresholds?: {
          small?: number;
          medium?: number;
          large?: number;
        };
        userTypes?: {
          firstTimeContributor?: boolean;
          maintainer?: boolean;
        };
        excludeLabels?: string[];
      };
    }>;
    fileBased?: {
      rules: Array<{
        filePatterns: string[];
        labels: string[];
      }>;
    };
    sizeBased?: {
      enabled: boolean;
      thresholds: {
        small: number;
        medium: number;
        large: number;
      };
      labels: {
        small: string;
        medium: string;
        large: string;
        extraLarge: string;
      };
    };
    contributorBased?: {
      enabled: boolean;
      labels: {
        firstTimeContributor: string;
        maintainer: string;
      };
    };
  };
}

export interface CodeReviewConfig {
  skipReviewLabel: string;
  excludePatterns?: string[];
  includePatterns?: string[];
  maxFileSize?: number;
  maxContentSize?: number;
  confidenceThreshold?: number;
  maxComments?: number;
  batchSize?: number;
  model?: string;
  maxTokens?: number;
  customInstructions?: string;
  createReview?: boolean;
  reviewHeader?: string;
  showConfidence?: boolean;
  addDisclaimer?: boolean;
  includeOverallFeedback?: boolean;
  // Azure OpenAI options
  useAzure?: boolean;
}

export interface BotConfig {
  stale: StaleConfig;
  prTitle: PRTitleConfig;
  labels: LabelConfig;
  codeReview: CodeReviewConfig;
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
  codeReview: {
    skipReviewLabel: 'skip-ai-review',
    excludePatterns: [
      '\\.md$',
      '\\.json$',
      '\\.lock$',
      'package-lock.json',
      'yarn.lock',
      'node_modules/',
      'dist/',
      'build/',
      '\\.min\\.(js|css)$'
    ],
    includePatterns: [],
    maxFileSize: 1000, // Skip files with more than 1000 lines changed
    maxContentSize: 100000, // Skip files larger than 100KB
    confidenceThreshold: 60, // Only include suggestions with 60% or higher confidence
    maxComments: 10, // Limit to 10 comments per PR
    batchSize: 3, // Process files in batches of 3
    model: 'gpt-4',
    maxTokens: 2000,
    createReview: true, // Create a single review instead of individual comments
    reviewHeader: '## AI Code Review\n\nI\'ve analyzed this PR and have some suggestions:',
    showConfidence: true,
    addDisclaimer: true,
    includeOverallFeedback: true,
    customInstructions: 'Focus on security issues, performance improvements, and best practices.',
    // Azure OpenAI options
    useAzure: false // Set to true to use Azure OpenAI instead of OpenAI
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
      'size': ['size: small', 'size: medium', 'size: large', 'size: extra-large'],
      'contributor': ['first-time-contributor', 'maintainer'],
    },
    autoLabeling: {
      rules: [
        {
          pattern: '\\bfix(es|ed)?\\b|\\bbug\\b',
          labels: ['bug'],
          scope: 'both',
          priority: 1,
        },
        {
          pattern: '\\bdoc(s|umentation)?\\b',
          labels: ['documentation'],
          scope: 'both',
          priority: 1,
        },
        {
          pattern: '\\bfeature\\b|\\benhancement\\b',
          labels: ['enhancement'],
          scope: 'both',
          priority: 1,
        },
        {
          pattern: '\\bcritical\\b|\\burgent\\b|\\bhigh\\spriority\\b',
          labels: ['priority: critical'],
          scope: 'both',
          priority: 2,
        },
        {
          pattern: '\\bsecurity\\b|\\bvulnerability\\b',
          labels: ['bug', 'priority: critical'],
          scope: 'both',
          priority: 3,
          conditions: {
            excludeLabels: ['enhancement', 'documentation']
          }
        },
      ],
      fileBased: {
        rules: [
          {
            filePatterns: ['\\.md$', 'docs/.*'],
            labels: ['documentation']
          },
          {
            filePatterns: ['\\.tsx?$', '\\.jsx?$'],
            labels: ['frontend']
          },
          {
            filePatterns: ['\\.css$', '\\.scss$', '\\.less$'],
            labels: ['styling']
          },
          {
            filePatterns: ['package\\.json', 'package-lock\\.json', 'yarn\\.lock'],
            labels: ['dependencies']
          },
          {
            filePatterns: ['\\.github/.*', 'workflows/.*'],
            labels: ['ci/cd']
          }
        ]
      },
      sizeBased: {
        enabled: true,
        thresholds: {
          small: 10,
          medium: 100,
          large: 500
        },
        labels: {
          small: 'size: small',
          medium: 'size: medium',
          large: 'size: large',
          extraLarge: 'size: extra-large'
        }
      },
      contributorBased: {
        enabled: true,
        labels: {
          firstTimeContributor: 'first-time-contributor',
          maintainer: 'maintainer'
        }
      }
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
