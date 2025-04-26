import { CodeReviewConfig } from '../../config/config-loader';
import { logger } from '../../utils/logger';
import { callOpenAI } from './ai-service';

interface FileDetail {
  filename: string;
  content: string;
  patch: string;
  additions: number;
  deletions: number;
  changes: number;
}

export interface AnalysisResult {
  filename: string;
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
 * Analyze code changes to identify potential issues and improvements
 */
export async function analyzeCodeChanges(
  files: FileDetail[],
  config: CodeReviewConfig
): Promise<AnalysisResult[]> {
  logger.debug(`Analyzing ${files.length} files for code review`);
  
  const results: AnalysisResult[] = [];
  
  // Process files in batches to avoid rate limits
  const batchSize = config.batchSize || 5;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    // Process each file in the batch in parallel
    const batchResults = await Promise.all(batch.map(async file => {
      try {
        return await analyzeFile(file, config);
      } catch (error) {
        logger.error(`Error analyzing file ${file.filename}`, error);
        return {
          filename: file.filename,
          suggestions: []
        };
      }
    }));
    
    results.push(...batchResults);
    
    // Add a delay between batches to avoid rate limits
    if (i + batchSize < files.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Analyze a single file for code review
 */
async function analyzeFile(
  file: FileDetail,
  config: CodeReviewConfig
): Promise<AnalysisResult> {
  logger.debug(`Analyzing file: ${file.filename}`);
  
  // Skip files that are too large
  if (file.content.length > (config.maxContentSize || 100000)) {
    logger.info(`File ${file.filename} is too large to analyze (${file.content.length} bytes)`);
    return {
      filename: file.filename,
      suggestions: []
    };
  }
  
  // Determine the file type based on extension
  const fileExtension = file.filename.split('.').pop()?.toLowerCase() || '';
  const fileType = getFileType(fileExtension);
  
  // Skip unsupported file types
  if (!fileType) {
    logger.info(`File type not supported for analysis: ${file.filename}`);
    return {
      filename: file.filename,
      suggestions: []
    };
  }
  
  // Extract the changed lines from the patch
  const changedLines = extractChangedLines(file.patch);
  
  if (changedLines.length === 0) {
    logger.info(`No changed lines found in file: ${file.filename}`);
    return {
      filename: file.filename,
      suggestions: []
    };
  }
  
  // Prepare the context for AI analysis
  const context = {
    filename: file.filename,
    fileType,
    content: file.content,
    patch: file.patch,
    changedLines
  };
  
  // Call the AI service to analyze the code
  const analysisResult = await callOpenAI(context, config);
  
  return {
    filename: file.filename,
    suggestions: analysisResult.suggestions,
    overallFeedback: analysisResult.overallFeedback
  };
}

/**
 * Extract changed lines from a git patch
 */
function extractChangedLines(patch: string): Array<{ lineNumber: number, content: string, type: 'add' | 'remove' }> {
  if (!patch) return [];
  
  const lines = patch.split('\n');
  const changedLines: Array<{ lineNumber: number, content: string, type: 'add' | 'remove' }> = [];
  let currentLine = 0;
  
  for (const line of lines) {
    if (line.startsWith('@@')) {
      // Parse the line numbers from the hunk header
      // Format: @@ -a,b +c,d @@
      const match = line.match(/@@ -(\d+),\d+ \+(\d+),\d+ @@/);
      if (match) {
        currentLine = parseInt(match[2], 10);
      }
      continue;
    }
    
    if (line.startsWith('+') && !line.startsWith('++')) {
      changedLines.push({
        lineNumber: currentLine,
        content: line.substring(1),
        type: 'add'
      });
      currentLine++;
    } else if (line.startsWith('-') && !line.startsWith('--')) {
      changedLines.push({
        lineNumber: currentLine,
        content: line.substring(1),
        type: 'remove'
      });
      // Don't increment currentLine for removed lines
    } else {
      // Context lines
      currentLine++;
    }
  }
  
  return changedLines;
}

/**
 * Determine the file type based on extension
 */
function getFileType(extension: string): string | null {
  const fileTypeMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'go': 'go',
    'php': 'php',
    'cs': 'csharp',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'swift': 'swift',
    'kt': 'kotlin',
    'rs': 'rust',
    'dart': 'dart',
    'ex': 'elixir',
    'exs': 'elixir',
    'hs': 'haskell',
    'lua': 'lua',
    'r': 'r',
    'scala': 'scala',
    'pl': 'perl',
    'pm': 'perl',
    'clj': 'clojure',
    'fs': 'fsharp',
    'fsx': 'fsharp'
  };
  
  return fileTypeMap[extension] || null;
}
