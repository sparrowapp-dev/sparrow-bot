# Sparrow Bot

<div align="center">
  <img src="docs/assets/sparrow-bot-logo.png" alt="Sparrow Bot Logo" width="200" />
  <p>A GitHub bot that automates repository maintenance tasks.</p>
</div>

[![CI/CD](https://github.com/sparrowapp-dev/sparrow-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/sparrowapp-dev/sparrow-bot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)

## 🌟 Features

### 1. Stale Issue/PR Management
- Auto-mark issues/PRs as stale after 60 days of inactivity
- Close stale items after 7 days without activity
- Exclude items with specific labels (pinned, security, bug)
- Send friendly notification messages

### 2. PR Title Validation
- Enforce conventional commit format
- Check against allowed types and scopes
- Provide helpful feedback for invalid titles
- Update PR status checks

### 3. Label Management
- Maintain consistent label schemes across repositories
- Auto-apply labels based on PR/Issue content
- Support label categories and hierarchies

### 4. AI-Powered Code Review
- Automatically analyze code changes in PRs
- Provide intelligent suggestions for improvements
- Detect potential bugs, security issues, and performance problems
- Customize review focus and scope

## 🚀 Getting Started

### Installation

#### As a GitHub Action

Add the following to your workflow file (e.g., `.github/workflows/sparrow-bot.yml`):

```yaml
name: Sparrow Bot

on:
  issues:
    types: [opened, edited, closed, reopened]
  pull_request:
    types: [opened, edited, synchronize, closed, reopened]
  schedule:
    - cron: '0 0 * * *'  # Run daily at midnight UTC

jobs:
  stale:
    name: Check for stale issues and PRs
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - name: Run Sparrow Bot Stale Check
        uses: sparrowapp-dev/sparrow-bot@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          command: stale

  pr-title:
    name: Validate PR title
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Run Sparrow Bot PR Title Validation
        uses: sparrowapp-dev/sparrow-bot@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          command: pr-title
          pr-title: ${{ github.event.pull_request.title }}
          pr-number: ${{ github.event.pull_request.number }}
          commit-sha: ${{ github.event.pull_request.head.sha }}

  code-review:
    name: AI Code Review
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Run Sparrow Bot Code Review
        uses: sparrowapp-dev/sparrow-bot@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          command: code-review
          pr-number: ${{ github.event.pull_request.number }}
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

#### As a Node.js Package

```bash
# Install the package
npm install sparrow-bot

# Create a configuration file
touch .github/sparrow-bot.json
```

### Configuration

Create a configuration file in your repository at `.github/sparrow-bot.json`:

```json
{
  "stale": {
    "daysBeforeStale": 60,
    "daysBeforeClose": 7,
    "exemptLabels": ["pinned", "security", "bug"],
    "staleLabel": "stale",
    "staleMessage": "🤖 **Sparrow Bot Here!**\n\nThis item has been automatically marked as stale because it hasn't had any activity in the last 60 days.\n\n- If this is still relevant, please comment or update it within 7 days.\n- If no activity occurs, this will be automatically closed.\n\nThank you for helping keep our repository organized! 🙏",
    "closeMessage": "🤖 **Sparrow Bot Here!**\n\nThis item has been automatically closed due to inactivity.\n\nFeel free to reopen it if you believe it still needs attention.\n\nThank you for your contributions! 🙏"
  },
  "prTitle": {
    "types": ["feat", "fix", "docs", "style", "refactor", "test", "chore", "build", "ci", "revert"],
    "scopes": ["core", "api", "ui", "docs", "deps"],
    "patterns": ["^(feat|fix|docs|style|refactor|test|chore|build|ci|revert)(\\(\\w+\\))?!?: .+$"]
  },
  "labels": {
    "categories": {
      "type": ["feature", "bug", "enhancement", "documentation", "maintenance"],
      "priority": ["critical", "high", "medium", "low"],
      "status": ["in-progress", "review-needed", "blocked", "completed"]
    },
    "autoLabeling": {
      "rules": [
        {
          "pattern": "\\bfix(es|ed)?\\b|\\bbug\\b",
          "labels": ["bug"]
        },
        {
          "pattern": "\\bdoc(s|umentation)?\\b",
          "labels": ["documentation"]
        }
      ]
    }
  },
  "codeReview": {
    "skipReviewLabel": "skip-ai-review",
    "excludePatterns": [
      "\\.md$",
      "\\.json$",
      "\\.lock$"
    ],
    "maxComments": 10,
    "model": "gpt-4",
    "createReview": true,
    "showConfidence": true,
    "addDisclaimer": true,
    "useAzure": false  // Set to true to use Azure OpenAI instead of OpenAI
  }
}
```

For more configuration options, see the [Configuration Documentation](docs/configuration.md).

## 💻 Development

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Setup

```bash
# Clone the repository
git clone https://github.com/sparrowapp-dev/sparrow-bot.git

# Install dependencies
cd sparrow-bot
npm install

# Create a .env file
cp .env.example .env
# Edit .env with your GitHub token
```

### Development Commands

```bash
# Run in development mode
npm run dev

# Run the CLI
npm run cli -- stale

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## 📚 Documentation

- [Configuration](docs/configuration.md)
- [API Reference](docs/api.md)
- [Code Review](docs/code-review.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## 🔧 Usage Examples

### Stale Management

```typescript
import { Octokit } from '@octokit/rest';
import { setupStaleManagement } from 'sparrow-bot';

const octokit = new Octokit({ auth: 'your-github-token' });
const staleManager = setupStaleManagement(octokit, {
  daysBeforeStale: 60,
  daysBeforeClose: 7,
  exemptLabels: ['pinned', 'security', 'bug'],
  staleLabel: 'stale',
});

// Process stale issues and PRs
await staleManager.processStaleItems('owner', 'repo');
```

### PR Title Validation

```typescript
import { Octokit } from '@octokit/rest';
import { setupPRTitleValidation } from 'sparrow-bot';

const octokit = new Octokit({ auth: 'your-github-token' });
const prTitleValidator = setupPRTitleValidation(octokit, {
  types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
  scopes: ['core', 'api', 'ui', 'docs', 'deps'],
  patterns: ['^(feat|fix|docs|style|refactor|test|chore)(\\(\\w+\\))?!?: .+$'],
});

// Validate a PR title
const result = await prTitleValidator.validatePRTitle(
  'owner',
  'repo',
  1,
  'feat(ui): add new button component',
  'commit-sha'
);
```

### AI Code Review

```typescript
import { Octokit } from '@octokit/rest';
import { setupCodeReviewAssistant } from 'sparrow-bot';

const octokit = new Octokit({ auth: 'your-github-token' });
const codeReviewAssistant = setupCodeReviewAssistant(octokit, {
  skipReviewLabel: 'skip-ai-review',
  excludePatterns: ['\\.md$', '\\.json$'],
  maxComments: 10,
  model: 'gpt-4',
  createReview: true,
  showConfidence: true,
  addDisclaimer: true,
  useAzure: false // Set to true to use Azure OpenAI instead of OpenAI
});

// Review a pull request
await codeReviewAssistant.reviewPullRequest('owner', 'repo', 123);
```

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
