# Sparrow Bot Quick Start Guide

This guide will help you quickly set up and start using Sparrow Bot in your GitHub repository.

## What is Sparrow Bot?

Sparrow Bot is a powerful GitHub automation tool that helps maintain your repository with features like:

- **Stale Issue Management**: Automatically mark and close inactive issues and PRs
- **PR Title Validation**: Enforce consistent PR title formats
- **Automated Labeling**: Intelligently apply labels based on content and context
- **AI-Powered Code Review**: Get automated code review suggestions using AI

## Installation

### Option 1: GitHub Action (Recommended)

1. Create a `.github/workflows/sparrow-bot.yml` file in your repository:

```yaml
name: Sparrow Bot

on:
  schedule:
    - cron: '0 0 * * *'  # Run daily at midnight
  workflow_dispatch:     # Allow manual triggering
  pull_request:
    types: [opened, edited, synchronize]
  issues:
    types: [opened, edited]

jobs:
  stale:
    name: Process Stale Items
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install Sparrow Bot
        run: npm install sparrow-bot
      
      - name: Process stale items
        run: npx sparrow-bot stale
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  
  pr-title:
    name: Validate PR Title
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install Sparrow Bot
        run: npm install sparrow-bot
      
      - name: Validate PR title
        run: npx sparrow-bot pr-title
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_TITLE: ${{ github.event.pull_request.title }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          COMMIT_SHA: ${{ github.event.pull_request.head.sha }}
  
  auto-label:
    name: Auto Label
    runs-on: ubuntu-latest
    if: github.event_name == 'issues' || github.event_name == 'pull_request'
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install Sparrow Bot
        run: npm install sparrow-bot
      
      - name: Auto label
        run: npx sparrow-bot auto-label
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ISSUE_NUMBER: ${{ github.event.issue.number || github.event.pull_request.number }}
          CONTENT: ${{ github.event.issue.body || github.event.pull_request.body }}
          TITLE: ${{ github.event.issue.title || github.event.pull_request.title }}
          IS_PR: ${{ github.event_name == 'pull_request' }}
```

2. For AI-powered code review, add this job to your workflow:

```yaml
  code-review:
    name: AI Code Review
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install Sparrow Bot
        run: npm install sparrow-bot
      
      - name: Run AI Code Review
        run: npx sparrow-bot code-review
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Option 2: NPM Package

1. Install the package in your project:

```bash
npm install sparrow-bot
```

2. Create a script to use Sparrow Bot:

```javascript
const { Octokit } = require('@octokit/rest');
const { 
  setupStaleManagement, 
  setupPRTitleValidation, 
  setupLabelManagement,
  setupCodeReviewAssistant
} = require('sparrow-bot');

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Setup features
const staleManager = setupStaleManagement(octokit, config.stale);
const prTitleValidator = setupPRTitleValidation(octokit, config.prTitle);
const labelManager = setupLabelManagement(octokit, config.labels);
const codeReviewAssistant = setupCodeReviewAssistant(octokit, config.codeReview);

// Use the features
async function main() {
  // Process stale issues and PRs
  await staleManager.processStaleItems('owner', 'repo');
  
  // Validate a PR title
  await prTitleValidator.validatePRTitle(
    'owner',
    'repo',
    1,
    'feat(ui): add new button component',
    'commit-sha'
  );
  
  // Auto-label an issue or PR
  await labelManager.autoLabelItem(
    'owner',
    'repo',
    1,
    'This is a bug that needs to be fixed'
  );
  
  // Review a PR with AI
  await codeReviewAssistant.reviewPullRequest('owner', 'repo', 123);
}

main().catch(console.error);
```

## Configuration

Create a `.github/sparrow-bot.json` file in your repository:

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
    "types": ["feat", "fix", "docs", "style", "refactor", "test", "chore"],
    "scopes": ["core", "api", "ui", "docs", "deps"],
    "patterns": ["^(feat|fix|docs|style|refactor|test|chore)(\\(\\w+\\))?!?: .+$"]
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
    "excludePatterns": ["\\.md$", "\\.json$", "\\.lock$"],
    "maxComments": 10,
    "model": "gpt-4",
    "createReview": true,
    "showConfidence": true,
    "addDisclaimer": true,
    "useAzure": false
  }
}
```

## Setting Up AI-Powered Code Review

### Using OpenAI

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it as a secret in your GitHub repository:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
3. Make sure your workflow includes the code review job (see above)

### Using Azure OpenAI

1. Set up Azure OpenAI (see [Azure OpenAI Integration Guide](./azure-openai-integration.md))
2. Add these secrets to your GitHub repository:
   - `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
   - `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint URL
   - `AZURE_OPENAI_DEPLOYMENT`: Your model deployment name
3. Set `useAzure: true` in your configuration file

## Next Steps

- **Customize Configuration**: Explore the [full configuration options](./configuration.md)
- **Advanced Features**: Learn about [enhanced auto-labeling](./auto-labeling.md)
- **AI Integration**: Set up [AI-powered code review](./code-review.md)
- **Azure OpenAI**: Use [Azure OpenAI instead of OpenAI](./azure-openai-integration.md)

## Troubleshooting

- **Workflow not running**: Check your workflow file syntax and GitHub Actions logs
- **Stale management not working**: Verify your configuration and check if the bot has the necessary permissions
- **PR title validation failing**: Check your PR title format against the configured patterns
- **Auto-labeling not applying labels**: Verify your label rules and make sure the labels exist in your repository
- **AI code review not working**: Check your API key and configuration

## Getting Help

- **Documentation**: Read the [full documentation](../README.md)
- **Issues**: Open an issue on the [GitHub repository](https://github.com/sparrowapp-dev/sparrow-bot/issues)
- **Discussions**: Join the [GitHub Discussions](https://github.com/sparrowapp-dev/sparrow-bot/discussions)
