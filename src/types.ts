export type CodingPersonaId = 
  | 'architect'
  | 'debugger'
  | 'optimizer'
  | 'security'
  | 'test_engineer'
  | 'mentor'
  | 'devops';

export interface CodingPersona {
  id: CodingPersonaId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  systemPromptModifier: string;
}

export interface AttachedFile {
  id: string;
  name: string;
  language: string;
  content: string;
  size: number;
}

export interface CodeArtifact {
  id: string;
  title: string;
  language: string;
  code: string;
  originalCode?: string;
  explanation?: string;
}

export interface ProjectFile {
  id: string;
  path: string; // e.g. "src/App.tsx", "index.html"
  name: string;
  content: string;
  language: string;
  updatedAt: number;
  size: number;
}

export interface ProjectMemory {
  projectName: string;
  description: string;
  techStack: string[];
  architectureNotes: string;
  keyDecisions: string[];
  todoList: string[];
  lastUpdated: number;
}

export interface AIWorkingStep {
  id: string;
  type: 'thinking' | 'working';
  title: string;
  detail?: string;
  status: 'running' | 'completed' | 'error';
  timestamp: number;
}

export interface ProjectDeliverable {
  summary: string;
  filesCreated: string[];
  filesUpdated: string[];
  filesDeleted?: string[];
  zipAvailable: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  thinkingText?: string;
  workingSteps?: AIWorkingStep[];
  deliveredFiles?: Array<{ path: string; language: string; action: 'create' | 'edit' | 'delete' }>;
  deliverable?: ProjectDeliverable;
  attachedFiles?: AttachedFile[];
  artifacts?: CodeArtifact[];
  isStreaming?: boolean;
  error?: string;
  stats?: {
    model?: string;
    durationMs?: number;
    tokensEstimated?: number;
  };
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  persona: CodingPersonaId;
  messages: ChatMessage[];
  pinned?: boolean;
  activeArtifact?: CodeArtifact | null;
  files: ProjectFile[];
  activeFileId?: string | null;
  projectMemory: ProjectMemory;
}

export interface QuickPrompt {
  id: string;
  label: string;
  icon: string;
  description: string;
  promptTemplate: string;
  category: 'debug' | 'optimize' | 'test' | 'refactor' | 'explain' | 'architecture';
}

export interface AnalysisResult {
  timeComplexity: string;
  spaceComplexity: string;
  securityScore: number; // 0-100
  maintainabilityScore: number; // 0-100
  potentialBugs: string[];
  suggestions: string[];
  bestPractices: string[];
}
