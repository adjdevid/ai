import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const BASE_SYSTEM_PROMPT = `You are CodeAI Studio, a world-class autonomous AI Software Engineer and full-stack project architect.
You operate directly inside the user's Project Working Directory with full read/write capabilities, persistent project memory, and ZIP project bundling.

CRITICAL INSTRUCTIONS ON OUTPUT FORMAT & BEHAVIOR:
1. WORKSPACE DIRECTORY & FILE OPERATIONS:
   - DO NOT DUMP massive walls of raw code directly in chat markdown text.
   - INSTEAD, write/create/update files directly into the project directory using structured XML tags:
     <file action="write" path="src/App.tsx">
     // complete code for src/App.tsx
     </file>
     <file action="write" path="index.html">
     <!DOCTYPE html>...
     </file>
   - For deleting a file: <file action="delete" path="oldFile.js"></file>
   - Always write complete, production-grade, bug-free, fully-typed code (TypeScript, React, HTML/CSS/Tailwind, Node.js, Python, etc.) without lazy placeholders.

2. REAL-TIME THINKING PROCESS:
   - Wrap your internal reasoning, architectural analysis, and requirement breakdown inside <thinking>...</thinking> tags at the start of your response.
   - Example:
     <thinking>
     Menganalisis kebutuhan aplikasi: Diperlukan arsitektur modular dengan state management terpusat...
     Rencana direktori: Membuat index.html, src/App.tsx, src/components/Card.tsx, styles.css...
     </thinking>

3. WORKING ACTIONS (STATUS STEPS):
   - Wrap each concrete step inside <working title="Action Title">Brief description</working> tags.
   - Example:
     <working title="Menyiapkan Struktur Folder src/components">Membuat direktori kerja modular untuk komponen UI</working>
     <working title="Menulis index.html & Tailwind Entry">Mengonfigurasi entry point web dan CDN styles</working>
     <working title="Membuat Logic State & Event Handlers">Mengimplementasikan type-safe state machine</working>

4. PROJECT MEMORY UPDATE:
   - Maintain and update the Project Memory at the end of your response using <memory>...</memory> tag with valid JSON:
     <memory>
     {
       "projectName": "Todo App Realtime",
       "description": "Aplikasi manajemen tugas interaktif dengan filter dan local persistence",
       "techStack": ["TypeScript", "Tailwind CSS", "HTML5", "LocalStorage"],
       "architectureNotes": "Komponen modular dengan single source of truth di App.tsx",
       "keyDecisions": ["Menggunakan Tailwind CDN untuk instant preview", "State immutable"],
       "todoList": ["Tambahkan drag-and-drop", "Integrasi cloud sync"]
     }
     </memory>

5. CHAT RESPONSE SUMMARY:
   - In the regular text of the message (outside of tags), provide a clear, professional, and friendly summary of what was accomplished, what files were created/modified in the directory, and how the user can test or run the project.
   - Highlight that all files are saved in their Project Workspace Directory and ready to be downloaded as a ZIP project package.
   - If the user communicates in Indonesian, respond in Indonesian. If in English, respond in English.`;

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite',
];

async function streamWithModelFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config: any;
  },
  res: express.Response
): Promise<void> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model,
          contents: params.contents,
          config: params.config,
        });

        let chunkCount = 0;
        for await (const chunk of responseStream) {
          if (chunk.text) {
            chunkCount++;
            res.write(`data: ${JSON.stringify({ text: chunk.text, model })}\n\n`);
          }
        }

        // Successfully completed streaming
        res.write(`data: ${JSON.stringify({ done: true, model })}\n\n`);
        res.end();
        return;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('Overloaded') ||
          errMsg.includes('fetch failed') ||
          errMsg.includes('ECONNRESET');

        console.warn(`[Gemini Fallback] Model ${model} (attempt ${attempt}) encountered error: ${errMsg}. Trying next option...`);

        if (isTransient && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }

        break;
      }
    }
  }

  // If all models failed
  console.error('All Gemini streaming models exhausted:', lastError);
  let errorMessage = lastError?.message || 'Error communicating with Gemini model';
  if (
    errorMessage.includes('503') ||
    errorMessage.includes('UNAVAILABLE') ||
    errorMessage.includes('high demand') ||
    errorMessage.includes('RESOURCE_EXHAUSTED')
  ) {
    errorMessage = 'Layanan AI sedang mengalami lonjakan trafik global (503 High Demand). Silakan klik "Coba Kirim Ulang" untuk mencoba kembali.';
  }

  res.write(`data: ${JSON.stringify({ error: errorMessage, done: true })}\n\n`);
  res.end();
}

async function executeGenerateWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
): Promise<{ response: any; modelUsed: string }> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return { response, modelUsed: model };
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('Overloaded') ||
          errMsg.includes('fetch failed');

        console.warn(`[Gemini Fallback] Non-streaming model ${model} (attempt ${attempt}) returned error: ${errMsg}. Trying next model...`);

        if (isTransient && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }

        break;
      }
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.8-flash (with automatic fallback to gemini-flash-latest / gemini-3.1-flash-lite)',
      timestamp: new Date().toISOString()
    });
  });

  // API Chat Streaming with SSE
  app.post('/api/chat/stream', async (req, res) => {
    const { 
      messages, 
      personaPrompt, 
      attachedFiles, 
      projectFiles, 
      projectMemory,
      temperature = 0.7 
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const ai = getGeminiClient();

      // Assemble system instruction
      let fullSystemInstruction = BASE_SYSTEM_PROMPT;
      if (personaPrompt) {
        fullSystemInstruction += `\n\n[Active Persona Guidance]:\n${personaPrompt}`;
      }

      // Context construction
      let contextHeader = '';
      
      // Project Memory context
      if (projectMemory) {
        contextHeader += `\n[CURRENT PROJECT MEMORY]:\n${JSON.stringify(projectMemory, null, 2)}\n`;
      }

      // Existing Project Directory Files context
      if (projectFiles && Array.isArray(projectFiles) && projectFiles.length > 0) {
        const fileListTree = projectFiles.map((f: any) => `- ${f.path} (${f.language}, ${(f.size || 0)} B)`).join('\n');
        const fileContentsSummary = projectFiles
          .map((f: any) => `=== File: ${f.path} ===\n\`\`\`${f.language || 'text'}\n${f.content}\n\`\`\``)
          .join('\n\n');

        contextHeader += `\n[EXISTING PROJECT WORKSPACE DIRECTORY]:\nTree:\n${fileListTree}\n\nContents of Current Files:\n${fileContentsSummary}\n`;
      } else {
        contextHeader += `\n[EXISTING PROJECT WORKSPACE DIRECTORY]:\n(Directory is currently empty. You should create necessary files like index.html, src files, package.json, README.md depending on user request).\n`;
      }

      // Convert messages to Gemini format contents
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const isLatestUserMsg = i === messages.length - 1 && msg.role === 'user';
        
        let textContent = msg.content || '';

        // If files attached to this message or top-level attachedFiles
        const filesToInclude = msg.attachedFiles || (isLatestUserMsg ? attachedFiles : null);
        if (filesToInclude && Array.isArray(filesToInclude) && filesToInclude.length > 0) {
          const filesSummary = filesToInclude
            .map((f: { name: string; language: string; content: string }) => 
              `--- Attached Snippet: ${f.name} (${f.language || 'plaintext'}) ---\n\`\`\`${f.language || ''}\n${f.content}\n\`\`\``
            )
            .join('\n\n');
          
          textContent = `[User Attached Snippets]:\n${filesSummary}\n\n${textContent}`;
        }

        if (isLatestUserMsg) {
          textContent = `${contextHeader}\n\n[User Request]:\n${textContent}`;
        }

        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: textContent }],
        });
      }

      await streamWithModelFallback(
        ai,
        {
          contents: contents as any,
          config: {
            systemInstruction: fullSystemInstruction,
            temperature: typeof temperature === 'number' ? Math.max(0, Math.min(2, temperature)) : 0.7,
          },
        },
        res
      );
    } catch (error: any) {
      console.error('Gemini Stream Error in Route Handler:', error);
      let errorMessage = error?.message || 'Error communicating with Gemini model';
      if (
        errorMessage.includes('503') ||
        errorMessage.includes('UNAVAILABLE') ||
        errorMessage.includes('high demand')
      ) {
        errorMessage = 'Layanan AI sedang mengalami lonjakan trafik global (503 High Demand). Silakan klik "Coba Kirim Ulang" untuk mencoba kembali.';
      }
      res.write(`data: ${JSON.stringify({ error: errorMessage, done: true })}\n\n`);
      res.end();
    }
  });

  // API Code Analysis & Auditing
  app.post('/api/code/analyze', async (req, res) => {
    const { code, language = 'typescript' } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Code is required for analysis' });
      return;
    }

    try {
      const ai = getGeminiClient();
      const prompt = `Analyze the following ${language} code thoroughly.
Return a structured JSON evaluation with time complexity, space complexity, security score (0-100), maintainability score (0-100), potential bugs, recommendations, and best practices.

Code to analyze:
\`\`\`${language}
${code}
\`\`\``;

      const { response } = await executeGenerateWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              timeComplexity: { type: Type.STRING, description: 'Big-O time complexity (e.g. O(n log n)) with explanation' },
              spaceComplexity: { type: Type.STRING, description: 'Big-O space complexity (e.g. O(n)) with explanation' },
              securityScore: { type: Type.INTEGER, description: 'Security audit score from 0 to 100' },
              maintainabilityScore: { type: Type.INTEGER, description: 'Maintainability index score from 0 to 100' },
              potentialBugs: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Identified bug risks, null safety hazards, or concurrency issues'
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Targeted code improvements and refactoring suggestions'
              },
              bestPractices: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Idiomatic patterns and standard library conventions'
              }
            },
            required: ['timeComplexity', 'spaceComplexity', 'securityScore', 'maintainabilityScore', 'potentialBugs', 'suggestions', 'bestPractices']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Analysis error:', err);
      res.status(500).json({ error: err.message || 'Failed to analyze code' });
    }
  });

  // API Code Refactor
  app.post('/api/code/refactor', async (req, res) => {
    const { code, language = 'typescript', goal = 'Clean Code & Optimization' } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Code is required' });
      return;
    }

    try {
      const ai = getGeminiClient();
      const prompt = `Refactor the following ${language} code with the goal: "${goal}".
Provide the refactored code and an itemized explanation of changes.

Source code:
\`\`\`${language}
${code}
\`\`\``;

      const { response } = await executeGenerateWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refactoredCode: { type: Type.STRING, description: 'The complete refactored code' },
              explanation: { type: Type.STRING, description: 'Summary of key improvements and rationale' },
              improvements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of specific refactoring enhancements'
              }
            },
            required: ['refactoredCode', 'explanation', 'improvements']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Refactor error:', err);
      res.status(500).json({ error: err.message || 'Failed to refactor code' });
    }
  });

  // API Unit Test Generator
  app.post('/api/code/generate-tests', async (req, res) => {
    const { code, language = 'typescript', framework = 'vitest' } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Code is required' });
      return;
    }

    try {
      const ai = getGeminiClient();
      const prompt = `Generate a full, production-ready unit test suite for the following ${language} code using ${framework}.
Include tests for normal inputs, edge cases (empty, null, extremes), and error conditions.

Source code:
\`\`\`${language}
${code}
\`\`\``;

      const { response } = await executeGenerateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert Test Automation Engineer. Return only complete, runnable test files.',
        }
      });

      res.json({ testCode: response.text || '' });
    } catch (err: any) {
      console.error('Test generation error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate tests' });
    }
  });

  // Setup Vite / Static handling
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CodeAI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
