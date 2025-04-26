# Azure OpenAI Integration Guide

This guide explains how to set up and use Sparrow Bot with Azure OpenAI instead of the standard OpenAI API. Azure OpenAI provides the same powerful AI capabilities with additional enterprise features like compliance, security, and regional availability.

## Prerequisites

Before you begin, you'll need:

1. An Azure subscription
2. Access to Azure OpenAI Service (requires approval from Microsoft)
3. A deployed model in Azure OpenAI
4. GitHub repository where you want to use Sparrow Bot

## Setting Up Azure OpenAI

### 1. Create an Azure OpenAI Resource

If you haven't already, create an Azure OpenAI resource:

1. Go to the [Azure Portal](https://portal.azure.com)
2. Search for "Azure OpenAI" and select it
3. Click "Create"
4. Fill in the required details:
   - Subscription: Your Azure subscription
   - Resource group: Create new or select existing
   - Region: Choose a supported region
   - Name: Give your resource a unique name
   - Pricing tier: Select the appropriate tier
5. Click "Review + create" and then "Create"

### 2. Deploy a Model

After your resource is created:

1. Go to your Azure OpenAI resource
2. Click on "Model deployments" in the left menu
3. Click "Create new deployment"
4. Select a model (e.g., "gpt-4" or "gpt-35-turbo")
5. Give your deployment a name (you'll need this later)
6. Set the appropriate capacity
7. Click "Create"

### 3. Get Your API Credentials

You'll need three pieces of information:

1. **API Key**: 
   - Go to your Azure OpenAI resource
   - Click on "Keys and Endpoint" in the left menu
   - Copy one of the keys (either Key 1 or Key 2)

2. **Endpoint**:
   - From the same "Keys and Endpoint" page
   - Copy the "Endpoint" URL (e.g., `https://your-resource-name.openai.azure.com/`)

3. **Deployment Name**:
   - This is the name you gave to your model deployment in step 2

## Configuring Sparrow Bot for Azure OpenAI

### Option 1: Using the Configuration File

Create or update your `.github/sparrow-bot.json` file:

```json
{
  "codeReview": {
    "skipReviewLabel": "skip-ai-review",
    "excludePatterns": [
      "\\.md$",
      "\\.json$",
      "\\.lock$"
    ],
    "maxComments": 10,
    "createReview": true,
    "showConfidence": true,
    "addDisclaimer": true,
    "useAzure": true  // Set this to true to use Azure OpenAI
  }
}
```

### Option 2: Using Environment Variables

If you prefer not to modify your configuration file, you can set the `SPARROW_USE_AZURE` environment variable to `true` when running the bot.

## Setting Up GitHub Secrets

Add your Azure OpenAI credentials as secrets in your GitHub repository:

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add the following secrets:
   - `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
   - `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint URL
   - `AZURE_OPENAI_DEPLOYMENT`: Your model deployment name

## Creating a GitHub Workflow

Create a file at `.github/workflows/sparrow-bot.yml`:

```yaml
name: Sparrow Bot with Azure OpenAI

on:
  pull_request:
    types: [opened, edited, synchronize, reopened]

jobs:
  code-review:
    name: AI Code Review
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm install sparrow-bot
      
      - name: Run AI Code Review
        run: npx sparrow-bot code-review
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          # Azure OpenAI API credentials
          AZURE_OPENAI_API_KEY: ${{ secrets.AZURE_OPENAI_API_KEY }}
          AZURE_OPENAI_ENDPOINT: ${{ secrets.AZURE_OPENAI_ENDPOINT }}
          AZURE_OPENAI_DEPLOYMENT: ${{ secrets.AZURE_OPENAI_DEPLOYMENT }}
```

## Using Programmatically

If you're using Sparrow Bot programmatically:

```javascript
import { Octokit } from '@octokit/rest';
import { setupCodeReviewAssistant } from 'sparrow-bot';

// Set up environment variables first:
// process.env.AZURE_OPENAI_API_KEY = 'your-api-key';
// process.env.AZURE_OPENAI_ENDPOINT = 'your-endpoint';
// process.env.AZURE_OPENAI_DEPLOYMENT = 'your-deployment-name';

const octokit = new Octokit({ auth: 'your-github-token' });
const codeReviewAssistant = setupCodeReviewAssistant(octokit, {
  skipReviewLabel: 'skip-ai-review',
  excludePatterns: ['\\.md$', '\\.json$'],
  maxComments: 10,
  createReview: true,
  showConfidence: true,
  addDisclaimer: true,
  useAzure: true  // Use Azure OpenAI instead of OpenAI
});

// Review a pull request
await codeReviewAssistant.reviewPullRequest('owner', 'repo', 123);
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Verify your API key is correct
   - Make sure you're using the correct endpoint URL

2. **Model Not Found**:
   - Verify your deployment name is correct
   - Check that the model is actually deployed in your Azure OpenAI resource

3. **Rate Limiting**:
   - Check your quota and usage in the Azure portal
   - Consider increasing your capacity or adjusting the `batchSize` parameter

4. **Region Issues**:
   - Make sure you're using the correct endpoint for your region
   - Some models may not be available in all regions

### Checking Logs

If you're having issues, check the GitHub Actions logs for detailed error messages. Look for lines containing "Azure OpenAI" or "Error calling Azure API".

## Cost Management

Azure OpenAI is a paid service. To manage costs:

1. Set appropriate limits on your Azure OpenAI resource
2. Configure Sparrow Bot to limit the number of files it processes
3. Use the `maxTokens` parameter to limit token usage
4. Consider using a smaller model for less complex code reviews

## Additional Resources

- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/)
- [Azure OpenAI Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)
- [Sparrow Bot Code Review Documentation](./code-review.md)
