# AI-Powered Code Review Assistant

The Code Review Assistant is an AI-powered feature of Sparrow Bot that automatically analyzes pull requests and provides intelligent code review comments. It helps improve code quality, catch potential bugs, and enforce best practices without requiring manual review for every change.

## Features

- **Automated Code Analysis**: Analyzes code changes in pull requests to identify potential issues
- **Intelligent Suggestions**: Provides specific, actionable suggestions for improvements
- **Customizable Rules**: Configure what types of issues to focus on and which files to include/exclude
- **Integration with GitHub**: Comments directly on pull requests with formatted, helpful feedback
- **Confidence Scoring**: Indicates the confidence level of each suggestion
- **Categorized Feedback**: Organizes suggestions by category (bugs, security, performance, etc.)

## Configuration

The Code Review Assistant can be configured in your `.github/sparrow-bot.json` file:

```json
{
  "codeReview": {
    "skipReviewLabel": "skip-ai-review",
    "excludePatterns": [
      "\\.md$",
      "\\.json$",
      "\\.lock$",
      "package-lock.json",
      "yarn.lock",
      "node_modules/",
      "dist/",
      "build/",
      "\\.min\\.(js|css)$"
    ],
    "includePatterns": [],
    "maxFileSize": 1000,
    "maxContentSize": 100000,
    "confidenceThreshold": 60,
    "maxComments": 10,
    "batchSize": 3,
    "model": "gpt-4",
    "maxTokens": 2000,
    "createReview": true,
    "reviewHeader": "## AI Code Review\n\nI've analyzed this PR and have some suggestions:",
    "showConfidence": true,
    "addDisclaimer": true,
    "includeOverallFeedback": true,
    "customInstructions": "Focus on security issues, performance improvements, and best practices."
  }
}
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `skipReviewLabel` | Label that, when applied to a PR, will cause the bot to skip reviewing it | `"skip-ai-review"` |
| `excludePatterns` | Array of regex patterns for files to exclude from review | See example above |
| `includePatterns` | Array of regex patterns for files to include in review (if empty, all non-excluded files are included) | `[]` |
| `maxFileSize` | Maximum number of changed lines in a file to review | `1000` |
| `maxContentSize` | Maximum file size in bytes to review | `100000` |
| `confidenceThreshold` | Minimum confidence level (0-100) for suggestions to be included | `60` |
| `maxComments` | Maximum number of comments to add to a PR | `10` |
| `batchSize` | Number of files to process in parallel | `3` |
| `model` | OpenAI model to use for analysis (not used with Azure) | `"gpt-4"` |
| `maxTokens` | Maximum tokens to use in API calls | `2000` |
| `useAzure` | Whether to use Azure OpenAI instead of OpenAI | `false` |
| `createReview` | Whether to create a single review with all comments or individual comments | `true` |
| `reviewHeader` | Header text for the review | See example above |
| `showConfidence` | Whether to show confidence scores in comments | `true` |
| `addDisclaimer` | Whether to add a disclaimer to comments | `true` |
| `includeOverallFeedback` | Whether to include overall feedback about the PR | `true` |
| `customInstructions` | Custom instructions to provide to the AI | See example above |

## Usage

### GitHub Action

To use the Code Review Assistant as a GitHub Action, create a workflow file at `.github/workflows/code-review.yml`:

```yaml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  code-review:
    name: AI Code Review
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Run AI Code Review
        uses: sparrowapp-dev/sparrow-bot@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          command: code-review
          pr-number: ${{ github.event.pull_request.number }}
        env:
          # For OpenAI (default)
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          # For Azure OpenAI (if useAzure is true in your config)
          AZURE_OPENAI_API_KEY: ${{ secrets.AZURE_OPENAI_API_KEY }}
          AZURE_OPENAI_ENDPOINT: ${{ secrets.AZURE_OPENAI_ENDPOINT }}
          AZURE_OPENAI_DEPLOYMENT: ${{ secrets.AZURE_OPENAI_DEPLOYMENT }}
```

### API Usage

You can also use the Code Review Assistant programmatically:

```typescript
import { Octokit } from '@octokit/rest';
import { setupCodeReviewAssistant } from 'sparrow-bot';

const octokit = new Octokit({
  auth: 'your-github-token',
});

const config = {
  skipReviewLabel: 'skip-ai-review',
  // ... other configuration options
};

const codeReviewAssistant = setupCodeReviewAssistant(octokit, config);

// Review a pull request
await codeReviewAssistant.reviewPullRequest('owner', 'repo', 123);
```

## Requirements

### Using OpenAI (default)
- An OpenAI API key (set as the `OPENAI_API_KEY` environment variable)
- GitHub token with permission to read PRs and add comments

### Using Azure OpenAI
- Azure OpenAI API key (set as the `AZURE_OPENAI_API_KEY` environment variable)
- Azure OpenAI endpoint (set as the `AZURE_OPENAI_ENDPOINT` environment variable)
- Azure OpenAI deployment name (set as the `AZURE_OPENAI_DEPLOYMENT` environment variable)
- GitHub token with permission to read PRs and add comments
- Set `useAzure: true` in your configuration

## Example Output

Here's an example of the feedback provided by the Code Review Assistant:

```
🐛 Bug Suggestion (85% confidence)

```javascript
if (user.isAdmin == true) {
```

Consider using strict equality (`===`) instead of loose equality (`==`). In JavaScript, loose equality can lead to unexpected type coercion issues.

---
*This suggestion was generated by AI and may not be perfect. Please review before applying.*
```

## Limitations

- The AI may occasionally make incorrect suggestions
- Large PRs with many files may take longer to process
- The quality of suggestions depends on the quality of the OpenAI model used
- Requires an OpenAI API key, which may incur costs depending on usage

## Troubleshooting

- **No comments are being added**: Check that your API key (OpenAI or Azure) is valid and has sufficient quota
- **Comments are not relevant**: Try adjusting the `confidenceThreshold` or providing more specific `customInstructions`
- **Too many comments**: Reduce the `maxComments` setting or increase the `confidenceThreshold`
- **Specific files are not being reviewed**: Check your `includePatterns` and `excludePatterns` settings
- **Azure OpenAI not working**: Verify that you've set all required environment variables (`AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, and `AZURE_OPENAI_DEPLOYMENT`) and that `useAzure` is set to `true` in your configuration
