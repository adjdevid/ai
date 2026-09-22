import { QuickPrompt } from '../types';

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'debug-error',
    label: 'Debug Stack Trace / Error',
    icon: 'Bug',
    description: 'Paste your error or unexpected behavior to diagnose root cause and get a fix.',
    promptTemplate: 'Please help me debug the following error and code. Pinpoint the exact root cause, why it happened, and provide the clean working solution:\n\n```\n// Paste error or broken code here\n```',
    category: 'debug'
  },
  {
    id: 'optimize-algo',
    label: 'Analyze & Optimize Big-O',
    icon: 'Zap',
    description: 'Calculate time/space complexity and optimize code for maximum performance.',
    promptTemplate: 'Please analyze the time and space complexity (Big-O) of this code, identify potential bottlenecks, and provide an optimized, high-performance refactored version:\n\n```\n// Paste code here\n```',
    category: 'optimize'
  },
  {
    id: 'write-unit-tests',
    label: 'Generate Full Test Suite',
    icon: 'CheckCircle2',
    description: 'Create thorough unit and edge case tests with mocking and assertions.',
    promptTemplate: 'Write a comprehensive unit test suite for the following code (including edge cases, null/undefined inputs, and async error handling):\n\n```\n// Paste code to test here\n```',
    category: 'test'
  },
  {
    id: 'refactor-clean-code',
    label: 'Refactor for Clean Code & SOLID',
    icon: 'Sparkles',
    description: 'Clean up technical debt, improve readability, modularity, and maintainability.',
    promptTemplate: 'Refactor this code to follow clean code standards, SOLID principles, idiomatic patterns, and strong type safety:\n\n```\n// Paste code to refactor here\n```',
    category: 'refactor'
  },
  {
    id: 'security-audit',
    label: 'Security & Vulnerability Audit',
    icon: 'ShieldAlert',
    description: 'Scan for OWASP vulnerabilities, injection vectors, and auth flaws.',
    promptTemplate: 'Conduct a thorough security audit of this code. Identify any security risks, input validation gaps, or vulnerabilities, and provide hardened replacement code:\n\n```\n// Paste code to audit here\n```',
    category: 'architecture'
  },
  {
    id: 'explain-code',
    label: 'Explain Step-by-Step',
    icon: 'GraduationCap',
    description: 'Break down complex logic, architectural decisions, and data flow clearly.',
    promptTemplate: 'Please explain how this code works step-by-step, including its data flow, core algorithms, and any non-obvious nuances:\n\n```\n// Paste code to explain here\n```',
    category: 'explain'
  },
  {
    id: 'convert-language',
    label: 'Convert to TypeScript / Another Language',
    icon: 'ArrowLeftRight',
    description: 'Translate code into idiomatic modern TypeScript, Python, Go, or Rust.',
    promptTemplate: 'Convert the following code into idiomatic, fully type-safe TypeScript (or specified target language), maintaining exact behavioral parity and utilizing modern features:\n\n```\n// Paste source code here\n```',
    category: 'refactor'
  },
  {
    id: 'create-full-feature',
    label: 'Build Interactive Web Component',
    icon: 'Code2',
    description: 'Generate a complete, self-contained HTML/CSS/JS or React widget ready for live preview.',
    promptTemplate: 'Create a complete, fully functional, self-contained interactive web component (HTML + Tailwind CSS + JavaScript in a single runnable HTML snippet) for: [describe your component or UI tool here]',
    category: 'architecture'
  }
];
