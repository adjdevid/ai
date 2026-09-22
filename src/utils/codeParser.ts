import { CodeArtifact } from '../types';

export function extractCodeArtifacts(markdownText: string): CodeArtifact[] {
  const artifacts: CodeArtifact[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  
  let match;
  let index = 1;

  while ((match = codeBlockRegex.exec(markdownText)) !== null) {
    const language = (match[1] || 'plaintext').toLowerCase().trim();
    const code = match[2].trim();
    
    if (code.length > 0) {
      let title = `Snippet ${index} (${language})`;
      if (language === 'html' || code.includes('<!DOCTYPE html>') || code.includes('<html>')) {
        title = `Web App Preview ${index}`;
      } else if (language === 'typescript' || language === 'ts') {
        title = `TypeScript Module ${index}`;
      } else if (language === 'python' || language === 'py') {
        title = `Python Script ${index}`;
      } else if (language === 'json') {
        title = `JSON Data ${index}`;
      } else if (language === 'sql') {
        title = `SQL Query ${index}`;
      }

      artifacts.push({
        id: `artifact-${Date.now()}-${index}`,
        title,
        language,
        code,
      });
      index++;
    }
  }

  return artifacts;
}

export function getFileExtension(language: string): string {
  const lang = language.toLowerCase();
  const map: Record<string, string> = {
    typescript: 'ts',
    ts: 'ts',
    javascript: 'js',
    js: 'js',
    python: 'py',
    py: 'py',
    html: 'html',
    css: 'css',
    json: 'json',
    sql: 'sql',
    go: 'go',
    rust: 'rs',
    rs: 'rs',
    cpp: 'cpp',
    c: 'c',
    csharp: 'cs',
    cs: 'cs',
    java: 'java',
    kotlin: 'kt',
    kt: 'kt',
    swift: 'swift',
    php: 'php',
    ruby: 'rb',
    rb: 'rb',
    shell: 'sh',
    bash: 'sh',
    sh: 'sh',
    yaml: 'yaml',
    yml: 'yml',
    dockerfile: 'dockerfile',
    markdown: 'md',
    md: 'md',
  };
  return map[lang] || 'txt';
}

export function detectLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    html: 'html',
    htm: 'html',
    css: 'css',
    json: 'json',
    sql: 'sql',
    go: 'go',
    rs: 'rust',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    php: 'php',
    rb: 'ruby',
    sh: 'bash',
    bash: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    md: 'markdown',
  };
  return map[ext] || 'plaintext';
}
