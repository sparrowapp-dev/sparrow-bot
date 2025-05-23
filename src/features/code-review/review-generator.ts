import { CodeReviewConfig } from '../../config/config-loader';
import { AnalysisResult } from './code-analyzer';
import { logger } from '../../utils/logger';

export interface ReviewComment {
  path: string;
  position: number;
  body: string;
}

/**
 * Generate review comments from analysis results
 */
export async function generateReviewComments(
  analysisResults: AnalysisResult[],
  config: CodeReviewConfig
): Promise<ReviewComment[]> {
  logger.debug(`Generating review comments from ${analysisResults.length} analysis results`);
  
  const comments: ReviewComment[] = [];
  
  // Process each file's analysis results
  for (const result of analysisResults) {
    // Skip files with no suggestions
    if (!result.suggestions || result.suggestions.length === 0) {
      continue;
    }
    
    // Filter suggestions based on confidence threshold
    const confidenceThreshold = config.confidenceThreshold || 50;
    const validSuggestions = result.suggestions.filter(s => s.confidence >= confidenceThreshold);
    
    // Sort suggestions by line number
    validSuggestions.sort((a, b) => a.line - b.line);
    
    // Generate a comment for each suggestion
    for (const suggestion of validSuggestions) {
      const comment = formatComment(suggestion, config);
      
      comments.push({
        path: result.filename,
        position: suggestion.line,
        body: comment
      });
    }
    
    // Add overall feedback as a comment at the end of the file if available
    if (result.overallFeedback && config.includeOverallFeedback) {
      comments.push({
        path: result.filename,
        position: 1, // First line as a fallback
        body: `## Overall Feedback\n\n${result.overallFeedback}`
      });
    }
  }
  
  // Limit the number of comments if configured
  if (config.maxComments && comments.length > config.maxComments) {
    // Sort by confidence (descending) to keep the most confident suggestions
    comments.sort((a, b) => {
      const confidenceA = extractConfidence(a.body);
      const confidenceB = extractConfidence(b.body);
      return confidenceB - confidenceA;
    });
    
    // Keep only the top N comments
    comments.splice(config.maxComments);
  }
  
  return comments;
}

/**
 * Format a comment from a suggestion
 */
function formatComment(
  suggestion: {
    line: number;
    content: string;
    suggestion: string;
    confidence: number;
    category: string;
  },
  config: CodeReviewConfig
): string {
  // Create emoji based on category
  const emoji = getCategoryEmoji(suggestion.category);
  
  // Format the comment
  let comment = `${emoji} **${capitalizeFirstLetter(suggestion.category)} Suggestion** `;
  
  // Add confidence indicator if enabled
  if (config.showConfidence) {
    comment += `(${suggestion.confidence}% confidence)\n\n`;
  } else {
    comment += `\n\n`;
  }
  
  // Add the problematic code if available
  if (suggestion.content) {
    comment += `\`\`\`\n${suggestion.content}\n\`\`\`\n\n`;
  }
  
  // Add the suggestion
  comment += `${suggestion.suggestion}\n\n`;
  
  // Add a disclaimer if configured
  if (config.addDisclaimer) {
    comment += `---\n*This suggestion was generated by AI and may not be perfect. Please review before applying.*`;
  }
  
  return comment;
}

/**
 * Get an emoji for a category
 */
function getCategoryEmoji(category: string): string {
  switch (category.toLowerCase()) {
    case 'bug':
      return '🐛';
    case 'security':
      return '🔒';
    case 'performance':
      return '⚡';
    case 'style':
      return '🎨';
    case 'documentation':
      return '📝';
    default:
      return '💡';
  }
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Extract confidence value from a comment
 */
function extractConfidence(comment: string): number {
  const match = comment.match(/\((\d+)% confidence\)/);
  return match ? parseInt(match[1], 10) : 0;
}
