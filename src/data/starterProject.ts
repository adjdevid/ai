import { ProjectFile, ProjectMemory } from '../types';

export const DEFAULT_PROJECT_MEMORY: ProjectMemory = {
  projectName: 'Modern Full-Stack App',
  description: 'Aplikasi interaktif dengan arsitektur modular, state-driven UI, dan instant sandbox preview.',
  techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
  architectureNotes: 'Virtual File System terintegrasi dengan Live Sandbox, export ZIP, dan context memory antar turn.',
  keyDecisions: [
    'Komponen UI modular dipisahkan per berkas',
    'Tailwind CSS untuk styling adaptif',
    'Virtual File System dapat dikompres ke ZIP kapan saja'
  ],
  todoList: [
    'Kembangkan komponen interaktif',
    'Tambahkan state persistence',
    'Ekspor ZIP untuk deployment'
  ],
  lastUpdated: Date.now(),
};

export const DEFAULT_STARTER_FILES: ProjectFile[] = [
  {
    id: 'starter-1',
    path: 'index.html',
    name: 'index.html',
    language: 'html',
    size: 1420,
    updatedAt: Date.now(),
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CodeAI Project Sandbox</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 flex items-center justify-center">
  <div class="max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-lg">
        ⚡
      </div>
      <div>
        <h1 class="text-lg font-bold text-slate-100">Live Project Sandbox</h1>
        <p class="text-xs text-slate-400">AI Working Directory Virtual Environment</p>
      </div>
    </div>

    <div class="p-4 rounded-xl bg-slate-950 border border-slate-800/80 mb-4 space-y-2">
      <div class="flex items-center justify-between text-xs">
        <span class="text-slate-400">Workspace Status:</span>
        <span class="text-emerald-400 font-semibold font-mono">● Active & Ready</span>
      </div>
      <div class="flex items-center justify-between text-xs">
        <span class="text-slate-400">ZIP Export:</span>
        <span class="text-blue-400 font-mono">Enabled (JSZip)</span>
      </div>
    </div>

    <p class="text-xs text-slate-300 leading-relaxed mb-4">
      Minta AI untuk membuat atau mengedit aplikasi apa saja. AI akan langsung menulis file di direktori kerja ini, berpikir, memproses langkah-langkah kerja, dan menyediakannya sebagai paket ZIP!
    </p>

    <div class="flex gap-2">
      <button onclick="alert('Halo dari sandbox!')" class="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-md shadow-blue-600/20">
        Test Interactive Event
      </button>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'starter-2',
    path: 'src/App.tsx',
    name: 'App.tsx',
    language: 'typescript',
    size: 980,
    updatedAt: Date.now(),
    content: `import React, { useState } from 'react';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
        <h2 className="text-xl font-bold text-slate-100 mb-2">Modern React Application</h2>
        <p className="text-xs text-slate-400 mb-4">Modular component driven by CodeAI Studio</p>

        <div className="py-6 px-4 bg-slate-950 rounded-xl border border-slate-800/60 mb-4">
          <span className="text-4xl font-bold text-blue-400 font-mono">{count}</span>
        </div>

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setCount(c => c - 1)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
          >
            Decrement
          </button>
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow"
          >
            Increment
          </button>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'starter-3',
    path: 'package.json',
    name: 'package.json',
    language: 'json',
    size: 420,
    updatedAt: Date.now(),
    content: `{
  "name": "codeai-project",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vite": "^6.0.0"
  }
}`,
  },
  {
    id: 'starter-4',
    path: 'README.md',
    name: 'README.md',
    language: 'markdown',
    size: 510,
    updatedAt: Date.now(),
    content: `# Project Workspace

Aplikasi ini dikembangkan secara cerdas oleh **CodeAI Studio**.

## 🚀 Fitur
- Direktori kerja modular
- Live Preview Sandbox
- Ekspor ZIP 1-klik
- Sinkronisasi Project Memory

## 📦 Menjalankan Secara Lokal
\`\`\`bash
npm install
npm run dev
\`\`\`
`,
  },
];
