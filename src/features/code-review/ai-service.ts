import { CodeReviewConfig } from '../../config/config-loader';
import { logger } from '../../utils/logger';
// We'll use dynamic import for node-fetch

// Define API provider types
type ApiProvider = 'openai' | 'azure';

interface AnalysisContext {
  filename: string;
  fileType: string;
  content: string;
  patch: string;
  changedLines: Array<{ lineNumber: number, content: string, type: 'add' | 'remove' }>;
}

interface AnalysisResponse {
  suggestions: Array<{
    line: number;
    content: string;
    suggestion: string;
    confidence: number;
    category: 'bug' | 'security' | 'performance' | 'style' | 'documentation' | 'other';
  }>;
  overallFeedback?: string;
}

/**
 * Call AI API (OpenAI or Azure) to analyze code changes
 */
export async function callOpenAI(
  context: AnalysisContext,
  config: CodeReviewConfig
): Promise<AnalysisResponse> {
  // Determine which API provider to use
  const apiProvider: ApiProvider = config.useAzure ? 'azure' : 'openai';
  logger.debug(`Calling ${apiProvider} API for file: ${context.filename}`);

  // Check if API key is available
  const apiKey = apiProvider === 'azure'
    ? process.env.AZURE_OPENAI_API_KEY
    : process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.error(`${apiProvider === 'azure' ? 'Azure OpenAI' : 'OpenAI'} API key not found. Set ${apiProvider === 'azure' ? 'AZURE_OPENAI_API_KEY' : 'OPENAI_API_KEY'} environment variable.`);
    return { suggestions: [] };
  }

  try {
    // Prepare the prompt for the AI
    const prompt = createPrompt(context, config);

    // Determine the API endpoint
    let apiEndpoint: string;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (apiProvider === 'azure') {
      // Azure OpenAI requires a specific endpoint format
      const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;

      if (!azureEndpoint || !azureDeployment) {
        logger.error('Azure OpenAI endpoint or deployment name not found. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT environment variables.');
        return { suggestions: [] };
      }

      apiEndpoint = `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2023-05-15`;
      headers['api-key'] = apiKey;
    } else {
      // Standard OpenAI API
      apiEndpoint = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Dynamically import node-fetch
    const { default: fetch } = await import('node-fetch');

    // Call the AI API
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: apiProvider === 'azure' ? null : (config.model || 'gpt-4'), // Azure doesn't need model in the request body
        messages: [
          {
            role: 'system',
            content: 'You are an expert code reviewer. Analyze the code changes and provide specific, actionable feedback. Focus on bugs, security issues, performance problems, and best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: config.maxTokens || 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${apiProvider} API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;

    // Parse the AI response
    return parseAIResponse(data, context);
  } catch (error) {
    logger.error(`Error calling ${apiProvider} API`, error);
    return { suggestions: [] };
  }
}

/**
 * Create a prompt for the AI based on the code context
 */
function createPrompt(context: AnalysisContext, config: CodeReviewConfig): string {
  // Extract the relevant information
  const { filename, fileType, content, patch, changedLines } = context;

  // Create a prompt that includes:
  // 1. The file name and type
  // 2. The changed lines with context
  // 3. Instructions for the AI

  let prompt = `Review the following code changes in file: ${filename} (${fileType})\n\n`;

  // Add the patch or changed lines with some context
  prompt += `PATCH:\n${patch}\n\n`;

  // Add the full file content if it's not too large
  if (content.length < 10000) {
    prompt += `FULL FILE CONTENT:\n${content}\n\n`;
  } else {
    prompt += `FULL FILE CONTENT: (too large to include)\n\n`;
  }

  // Add specific instructions
  prompt += `Please analyze these changes and provide feedback on the following aspects:
1. Potential bugs or logical errors
2. Security vulnerabilities
3. Performance issues
4. Code style and best practices
5. Documentation needs

For each issue you find, provide:
- The line number
- The problematic code
- A specific suggestion for improvement
- The category of the issue (bug, security, performance, style, documentation, other)
- A confidence level (0-100)

Format your response as JSON with the following structure:
{
  "suggestions": [
    {
      "line": <line_number>,
      "content": "<problematic_code>",
      "suggestion": "<improvement_suggestion>",
      "confidence": <confidence_level>,
      "category": "<category>"
    },
    ...
  ],
  "overallFeedback": "<general_feedback_about_the_changes>"
}

Focus only on the changed lines and their immediate context. Prioritize high-confidence, high-impact issues.`;

  // Add any custom instructions from the config
  if (config.customInstructions) {
    prompt += `\n\nAdditional instructions: ${config.customInstructions}`;
  }

  return prompt;
}

/**
 * Parse the AI response into a structured format
 */
function parseAIResponse(response: any, context: AnalysisContext): AnalysisResponse {
  try {
    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { suggestions: [] };
    }

    // Extract JSON from the response
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                      content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      logger.error('Could not extract JSON from AI response');
      return { suggestions: [] };
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsedResponse = JSON.parse(jsonStr);

    // Validate and clean up the response
    const suggestions = (parsedResponse.suggestions || [])
      .filter((s: any) => s.line && s.suggestion)
      .map((s: any) => ({
        line: parseInt(s.line, 10),
        content: s.content || '',
        suggestion: s.suggestion,
        confidence: Math.min(Math.max(parseInt(s.confidence, 10) || 50, 0), 100),
        category: ['bug', 'security', 'performance', 'style', 'documentation', 'other'].includes(s.category)
          ? s.category
          : 'other'
      }));

    return {
      suggestions,
      overallFeedback: parsedResponse.overallFeedback
    };
  } catch (error) {
    logger.error('Error parsing AI response', error);
    return { suggestions: [] };
  }
}
