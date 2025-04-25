# Sparrow Bot API

Sparrow Bot provides a programmatic API that you can use to integrate with your own applications.

## Installation

```bash
npm install sparrow-bot
```

## Usage

```typescript
import { Octokit } from '@octokit/rest';
import { 
  setupStaleManagement, 
  setupPRTitleValidation, 
  setupLabelManagement 
} from 'sparrow-bot';

// Initialize GitHub client
const octokit = new Octokit({
  auth: 'your-github-token',
});

// Load configuration
const config = {
  stale: {
    daysBeforeStale: 60,
    daysBeforeClose: 7,
    exemptLabels: ['pinned', 'security', 'bug'],
    staleLabel: 'stale',
  },
  prTitle: {
    types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
    scopes: ['core', 'api', 'ui', 'docs', 'deps'],
    patterns: ['^(feat|fix|docs|style|refactor|test|chore)(\\(\\w+\\))?!?: .+$'],
  },
  labels: {
    categories: {
      'type': ['feature', 'bug', 'enhancement', 'documentation', 'maintenance'],
      'priority': ['critical', 'high', 'medium', 'low'],
    },
    autoLabeling: {
      rules: [
        {
          pattern: '\\bfix(es|ed)?\\b|\\bbug\\b',
          labels: ['bug'],
        },
      ],
    },
  },
};

// Setup features
const staleManager = setupStaleManagement(octokit, config.stale);
const prTitleValidator = setupPRTitleValidation(octokit, config.prTitle);
const labelManager = setupLabelManagement(octokit, config.labels);

// Use the features
async function main() {
  // Process stale issues and PRs
  await staleManager.processStaleItems('owner', 'repo');
  
  // Validate a PR title
  const result = await prTitleValidator.validatePRTitle(
    'owner',
    'repo',
    1,
    'feat(ui): add new button component',
    'commit-sha'
  );
  console.log(result);
  
  // Auto-label an issue or PR
  const labels = await labelManager.autoLabelItem(
    'owner',
    'repo',
    1,
    'This is a bug that needs to be fixed'
  );
  console.log(labels);
  
  // Sync labels
  await labelManager.syncLabels('owner', 'repo');
}

main();
```

## API Reference

### Stale Management

```typescript
function setupStaleManagement(octokit: Octokit, config: StaleConfig): {
  processStaleItems: (owner: string, repo: string) => Promise<void>;
}
```

#### StaleConfig

```typescript
interface StaleConfig {
  daysBeforeStale: number;
  daysBeforeClose: number;
  exemptLabels: string[];
  staleLabel: string;
  staleMessage?: string;
  closeMessage?: string;
}
```

### PR Title Validation

```typescript
function setupPRTitleValidation(octokit: Octokit, config: PRTitleConfig): {
  validatePRTitle: (
    owner: string,
    repo: string,
    prNumber: number,
    title: string,
    sha: string
  ) => Promise<ValidationResult>;
}
```

#### PRTitleConfig

```typescript
interface PRTitleConfig {
  types: string[];
  scopes?: string[];
  patterns: string[];
}
```

#### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  message: string;
  errors?: string[];
}
```

### Label Management

```typescript
function setupLabelManagement(octokit: Octokit, config: LabelConfig): {
  syncLabels: (owner: string, repo: string) => Promise<void>;
  autoLabelItem: (
    owner: string,
    repo: string,
    issueNumber: number,
    content: string
  ) => Promise<string[]>;
}
```

#### LabelConfig

```typescript
interface LabelConfig {
  categories: Record<string, string[]>;
  autoLabeling: {
    rules: Array<{
      pattern: string;
      labels: string[];
    }>;
  };
}
```

## GitHub Client

Sparrow Bot uses the [Octokit](https://github.com/octokit/rest.js) library to interact with the GitHub API. You can use any Octokit-compatible client with Sparrow Bot.

```typescript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: 'your-github-token',
});
```

## Error Handling

All API methods return promises that may reject with errors. You should handle these errors appropriately in your application.

```typescript
try {
  await staleManager.processStaleItems('owner', 'repo');
} catch (error) {
  console.error('Failed to process stale items', error);
}
```
