import { ProjectFile, ProjectMemory, AIWorkingStep, ProjectDeliverable } from '../types';
import { detectLanguageFromFilename } from './codeParser';

export interface ParsedAIResponse {
  cleanContent: string;
  thinkingText: string;
  workingSteps: AIWorkingStep[];
  fileOperations: Array<{
    action: 'write' | 'delete';
    path: string;
    content: string;
    language: string;
  }>;
  updatedMemory: Partial<ProjectMemory> | null;
  deliverable: ProjectDeliverable | null;
}

/**
 * Parses raw AI response text containing <thinking>, <working>, <file>, and <memory> tags
 */
export function parseAIResponse(rawText: string, isStreaming: boolean = false): ParsedAIResponse {
  let thinkingText = '';
  const workingSteps: AIWorkingStep[] = [];
  const fileOperations: Array<{
    action: 'write' | 'delete';
    path: string;
    content: string;
    language: string;
  }> = [];
  let updatedMemory: Partial<ProjectMemory> | null = null;

  // 1. Extract <thinking>...</thinking>
  const thinkingMatch = rawText.match(/<thinking>([\s\S]*?)(?:<\/thinking>|$)/i);
  if (thinkingMatch) {
    thinkingText = thinkingMatch[1].trim();
  }

  // 2. Extract <working title="...">...</working>
  const workingRegex = /<working(?:(?:\s+title="([^"]*)")|\s*)>([\s\S]*?)(?:<\/working>|$)/gi;
  let workMatch;
  let stepIndex = 1;
  while ((workMatch = workingRegex.exec(rawText)) !== null) {
    const title = workMatch[1]?.trim() || `Step ${stepIndex}`;
    const detail = workMatch[2]?.trim() || '';
    const isClosed = workMatch[0].includes('</working>');
    workingSteps.push({
      id: `step-${stepIndex}`,
      type: 'working',
      title,
      detail,
      status: isClosed ? 'completed' : isStreaming ? 'running' : 'completed',
      timestamp: Date.now(),
    });
    stepIndex++;
  }

  // 3. Extract <file action="write|delete" path="...">...</file>
  const fileRegex = /<file\s+action="(write|delete)"\s+path="([^"]+)"(?:\s*)>([\s\S]*?)(?:<\/file>|$)/gi;
  let fileMatch;
  while ((fileMatch = fileRegex.exec(rawText)) !== null) {
    const action = (fileMatch[1]?.toLowerCase() === 'delete' ? 'delete' : 'write') as 'write' | 'delete';
    const filePath = fileMatch[2]?.trim() || 'unnamed-file.txt';
    const fileContent = fileMatch[3] || '';
    const filename = filePath.split('/').pop() || filePath;
    const language = detectLanguageFromFilename(filename);

    fileOperations.push({
      action,
      path: filePath,
      content: fileContent.replace(/^\n/, ''),
      language,
    });
  }

  // Fallback: Also support markdown code blocks if the model wrote standard code blocks with filenames like ```typescript path="src/App.tsx" or commented headers // src/App.tsx
  if (fileOperations.length === 0) {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\s*(?:(?:file|path|filename)="?([^"\n]+)"?)?\n([\s\S]*?)```/g;
    let cbMatch;
    while ((cbMatch = codeBlockRegex.exec(rawText)) !== null) {
      const lang = cbMatch[1] || 'typescript';
      let explicitPath = cbMatch[2];
      const code = cbMatch[3] || '';

      // Check if first line has // path or # path
      if (!explicitPath) {
        const firstLineMatch = code.match(/^(?:\/\/\s*|#\s*|\/\*\s*)([\w./-]+\.[a-zA-Z0-9]+)/);
        if (firstLineMatch) {
          explicitPath = firstLineMatch[1].trim();
        }
      }

      if (code.trim().length > 0) {
        const resolvedPath = explicitPath || (lang === 'html' ? 'index.html' : `src/module_${fileOperations.length + 1}.${lang === 'typescript' ? 'tsx' : lang}`);
        const filename = resolvedPath.split('/').pop() || resolvedPath;
        fileOperations.push({
          action: 'write',
          path: resolvedPath,
          content: code,
          language: detectLanguageFromFilename(filename),
        });
      }
    }
  }

  // 4. Extract <memory>...</memory>
  const memoryMatch = rawText.match(/<memory>([\s\S]*?)(?:<\/memory>|$)/i);
  if (memoryMatch) {
    try {
      const jsonText = memoryMatch[1].trim();
      const parsed = JSON.parse(jsonText);
      if (typeof parsed === 'object' && parsed !== null) {
        updatedMemory = {
          projectName: parsed.projectName,
          description: parsed.description,
          techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
          architectureNotes: parsed.architectureNotes || '',
          keyDecisions: Array.isArray(parsed.keyDecisions) ? parsed.keyDecisions : [],
          todoList: Array.isArray(parsed.todoList) ? parsed.todoList : [],
          lastUpdated: Date.now(),
        };
      }
    } catch {
      // Memory json might be streaming/incomplete
    }
  }

  // 5. Clean up the content for display
  let cleanContent = rawText
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<thinking>[\s\S]*/gi, '') // If streaming and unclosed
    .replace(/<working[\s\S]*?<\/working>/gi, '')
    .replace(/<working[\s\S]*/gi, '') // If streaming
    .replace(/<file[\s\S]*?<\/file>/gi, '')
    .replace(/<file[\s\S]*/gi, '') // If streaming
    .replace(/<memory>[\s\S]*?<\/memory>/gi, '')
    .replace(/<memory>[\s\S]*/gi, '') // If streaming
    .trim();

  // Create deliverable summary
  const filesCreated = fileOperations.filter(f => f.action === 'write').map(f => f.path);
  const filesDeleted = fileOperations.filter(f => f.action === 'delete').map(f => f.path);

  const deliverable: ProjectDeliverable | null = (filesCreated.length > 0 || filesDeleted.length > 0) ? {
    summary: `${filesCreated.length} file(s) created/modified in workspace.`,
    filesCreated,
    filesUpdated: [],
    filesDeleted,
    zipAvailable: filesCreated.length > 0,
  } : null;

  return {
    cleanContent,
    thinkingText,
    workingSteps,
    fileOperations,
    updatedMemory,
    deliverable,
  };
}

/**
 * Applies file operations to existing project files array
 */
export function applyFileOperations(
  currentFiles: ProjectFile[],
  operations: Array<{ action: 'write' | 'delete'; path: string; content: string; language: string }>
): ProjectFile[] {
  const fileMap = new Map<string, ProjectFile>();
  for (const f of currentFiles) {
    fileMap.set(f.path, f);
  }

  for (const op of operations) {
    if (op.action === 'delete') {
      fileMap.delete(op.path);
    } else {
      const filename = op.path.split('/').pop() || op.path;
      const existing = fileMap.get(op.path);
      fileMap.set(op.path, {
        id: existing?.id || `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        path: op.path,
        name: filename,
        content: op.content,
        language: op.language || detectLanguageFromFilename(filename),
        updatedAt: Date.now(),
        size: new Blob([op.content]).size,
      });
    }
  }

  return Array.from(fileMap.values());
}
