import { CodingPersona } from '../types';

export const CODING_PERSONAS: CodingPersona[] = [
  {
    id: 'architect',
    name: 'Full-Stack Architect',
    tagline: 'Clean Architecture & Scalable Systems',
    description: 'Senior software architect providing idiomatic, maintainable code, modern patterns, and system design insights.',
    icon: 'Layers',
    color: 'from-blue-500 to-indigo-600',
    systemPromptModifier: `You are a Principal Full-Stack Software Architect with deep expertise across modern web stacks (TypeScript, React, Node.js, Python, Go, Rust, SQL/NoSQL, Cloud native).
Always write clean, modular, production-grade code following SOLID principles, clean architecture, and type safety.
Provide architectural rationale, mention trade-offs, and prioritize security, readability, and performance.`
  },
  {
    id: 'debugger',
    name: 'Bug Hunter & Debugger',
    tagline: 'Root Cause & Fix Expert',
    description: 'Specializes in analyzing stack traces, hunting edge cases, race conditions, memory leaks, and fixing bugs accurately.',
    icon: 'Bug',
    color: 'from-rose-500 to-amber-600',
    systemPromptModifier: `You are a Senior Debugging & Incident Engineer.
When analyzing errors or code:
1. Pinpoint the exact root cause clearly.
2. Explain WHY it failed with precision.
3. Provide the corrected code with minimal diffs and clear comments.
4. Highlight subtle edge cases and how to prevent similar regressions.`
  },
  {
    id: 'optimizer',
    name: 'Performance Optimizer',
    tagline: 'Big-O & Low Latency',
    description: 'Specializes in algorithm optimization, caching, reducing bundle size, query optimization, and memory efficiency.',
    icon: 'Zap',
    color: 'from-amber-500 to-yellow-600',
    systemPromptModifier: `You are a Performance & Algorithmic Optimization Specialist.
Evaluate algorithmic time and space complexity (Big-O notation).
Find performance bottlenecks, memory allocations, excessive rendering, or unindexed queries.
Deliver high-throughput, latency-optimized, and benchmarked code snippets.`
  },
  {
    id: 'security',
    name: 'AppSec & Code Auditor',
    tagline: 'OWASP & Secure Coding',
    description: 'Audits code for vulnerabilities (XSS, SQLi, CSRF, auth flaws, input validation) and suggests security hardenings.',
    icon: 'ShieldCheck',
    color: 'from-emerald-500 to-teal-600',
    systemPromptModifier: `You are a Senior Application Security Auditor (AppSec) adhering strictly to OWASP Top 10, CWE standards, and defensive coding.
Analyze snippets for vulnerabilities: SQL injection, sanitization issues, SSRF, XSS, token leakage, replay attacks, or unsafe deserialization.
Deliver hardened, cryptographically sound implementations.`
  },
  {
    id: 'test_engineer',
    name: 'QA & Test Engineer',
    tagline: 'Unit, Integration & E2E Tests',
    description: 'Generates comprehensive test suites using Vitest, Jest, PyTest, Playwright, Cypress, and mocking frameworks.',
    icon: 'CheckCircle2',
    color: 'from-purple-500 to-pink-600',
    systemPromptModifier: `You are a Senior QA Automation Engineer.
Write robust unit tests, integration tests, and edge-case suites (using Jest, Vitest, PyTest, or Go testing depending on language).
Cover positive cases, boundary conditions, error throwing, async mocking, and property-based test patterns.`
  },
  {
    id: 'mentor',
    name: 'Code Mentor & Explainer',
    tagline: 'Clear Concept Walkthroughs',
    description: 'Explains complex code line-by-line, breaks down algorithms with analogies, and teaches best practices.',
    icon: 'GraduationCap',
    color: 'from-cyan-500 to-blue-600',
    systemPromptModifier: `You are an empathetic, clear Senior Code Mentor.
Explain concepts step-by-step with intuitive analogies, annotated code snippets, and visual ASCII diagrams when helpful.
Ensure the developer learns both the "how" and the "why".`
  }
];

export const STARTER_TEMPLATES = [
  {
    id: 'react-component',
    title: 'Modern React Hook & Component',
    language: 'typescript',
    snippet: `import React, { useState, useEffect } from 'react';\n\ninterface DataTableProps<T> {\n  data: T[];\n  onRowClick?: (item: T) => void;\n}\n\nexport function DataTable<T extends { id: string | number }>({ data, onRowClick }: DataTableProps<T>) {\n  const [search, setSearch] = useState('');\n  \n  return (\n    <div className="p-4 border rounded-lg">\n      <input\n        value={search}\n        onChange={(e) => setSearch(e.target.value)}\n        placeholder="Filter items..."\n        className="w-full px-3 py-2 border rounded"\n      />\n    </div>\n  );\n}`
  },
  {
    id: 'express-api',
    title: 'Express REST API with Validation',
    language: 'typescript',
    snippet: `import express from 'express';\n\nconst app = express();\napp.use(express.json());\n\ninterface User {\n  id: string;\n  email: string;\n  role: 'admin' | 'user';\n}\n\napp.post('/api/users', (req, res) => {\n  const { email, role } = req.body;\n  if (!email || !email.includes('@')) {\n    return res.status(400).json({ error: 'Valid email required' });\n  }\n  res.status(201).json({ success: true });\n});`
  },
  {
    id: 'python-algo',
    title: 'Python LRU Cache Implementation',
    language: 'python',
    snippet: `class Node:\n    def __init__(self, key: int, value: int):\n        self.key = key\n        self.value = value\n        self.prev = None\n        self.next = None\n\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        self.cache = {}\n        self.head = Node(0, 0)\n        self.tail = Node(0, 0)\n        self.head.next = self.tail\n        self.tail.prev = self.head`
  },
  {
    id: 'interactive-html',
    title: 'Interactive HTML/Canvas Demo',
    language: 'html',
    snippet: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { background: #0f172a; color: white; display: grid; place-items: center; height: 100vh; font-family: sans-serif; margin: 0; }\n    .card { background: #1e293b; padding: 2rem; border-radius: 1rem; text-align: center; border: 1px solid #334155; }\n    button { background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; }\n    button:hover { background: #2563eb; }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h2>CodeAI Interactive Canvas</h2>\n    <p>Click below to generate visual particles</p>\n    <button onclick="alert('Hello from interactive preview!')">Run Interaction</button>\n  </div>\n</body>\n</html>`
  }
];
