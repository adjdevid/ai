import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { ProjectMemoryModal } from './components/ProjectMemoryModal';
import { FileAttachModal } from './components/FileAttachModal';
import { SettingsModal } from './components/SettingsModal';
import { 
  ChatThread, 
  ChatMessage as ChatMessageType, 
  CodingPersonaId, 
  AttachedFile, 
  ProjectFile,
  ProjectMemory 
} from './types';
import { CODING_PERSONAS, STARTER_TEMPLATES } from './data/personas';
import { DEFAULT_PROJECT_MEMORY, DEFAULT_STARTER_FILES } from './data/starterProject';
import { parseAIResponse, applyFileOperations } from './utils/aiResponseParser';
import { downloadProjectZip } from './utils/zipUtils';

const STORAGE_KEY = 'codeai_studio_threads_v2';
const SETTINGS_KEY = 'codeai_studio_settings_v2';

const INITIAL_WELCOME_MESSAGE: ChatMessageType = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `### Halo! Selamat datang di **CodeAI Studio** 🚀
Saya adalah arsitek & perekayasa perangkat lunak otonom Anda yang ditenagai oleh **Gemini 3.8 Flash**.

Saya beroperasi langsung di dalam direktori kerja proyek Anda:
- 📁 **Direktori Berkas Lengkap**: Membuat, mengedit, dan mengelola struktur proyek secara otomatis.
- 🧠 **Project Memory & State**: Mempertahankan konteks arsitektur, dependensi, dan keputusan teknis antar giliran.
- ⚡ **Eksekusi Bersih**: Menampilkan berkas secara langsung saat proses pengerjaan dan hasil ringkas saat selesai.
- 📦 **Ekspor ZIP Instan**: Unduh seluruh kode proyek dalam format paket .zip dengan 1 klik.

Ketikkan kebutuhan proyek atau aplikasi yang ingin Anda bangun di bawah ini!`,
  timestamp: Date.now(),
};

export default function App() {
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t) => ({
            ...t,
            files: t.files || DEFAULT_STARTER_FILES,
            projectMemory: t.projectMemory || DEFAULT_PROJECT_MEMORY,
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }

    const initialThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: 'Modern Full-Stack App',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      persona: 'architect',
      messages: [INITIAL_WELCOME_MESSAGE],
      files: DEFAULT_STARTER_FILES,
      activeFileId: DEFAULT_STARTER_FILES[0]?.id || null,
      projectMemory: DEFAULT_PROJECT_MEMORY,
    };
    return [initialThread];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(() => threads[0]?.id || 'default');
  const [viewMode, setViewMode] = useState<'chat' | 'split' | 'workspace'>('chat');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  const [isOpenAttachModal, setIsOpenAttachModal] = useState(false);
  const [isOpenSettingsModal, setIsOpenSettingsModal] = useState(false);
  const [isOpenMemoryModal, setIsOpenMemoryModal] = useState(false);

  // Settings
  const [temperature, setTemperature] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.temperature === 'number') return parsed.temperature;
      }
    } catch {}
    return 0.7;
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active Thread derivation
  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const activePersona = CODING_PERSONAS.find((p) => p.id === activeThread?.persona) || CODING_PERSONAS[0];

  // Save threads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    } catch (e) {
      console.error(e);
    }
  }, [threads]);

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ temperature }));
    } catch (e) {
      console.error(e);
    }
  }, [temperature]);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages?.length, isStreaming]);

  // Create new thread
  const handleNewThread = () => {
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: 'New Coding Project',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      persona: activePersona.id,
      messages: [INITIAL_WELCOME_MESSAGE],
      files: DEFAULT_STARTER_FILES,
      activeFileId: DEFAULT_STARTER_FILES[0]?.id || null,
      projectMemory: {
        ...DEFAULT_PROJECT_MEMORY,
        projectName: 'New Coding Project',
        lastUpdated: Date.now(),
      },
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  };

  // Delete thread
  const handleDeleteThread = (threadId: string) => {
    const remaining = threads.filter((t) => t.id !== threadId);
    if (remaining.length === 0) {
      const newThread: ChatThread = {
        id: `thread-${Date.now()}`,
        title: 'New Coding Project',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        persona: 'architect',
        messages: [INITIAL_WELCOME_MESSAGE],
        files: DEFAULT_STARTER_FILES,
        activeFileId: DEFAULT_STARTER_FILES[0]?.id || null,
        projectMemory: DEFAULT_PROJECT_MEMORY,
      };
      setThreads([newThread]);
      setActiveThreadId(newThread.id);
    } else {
      setThreads(remaining);
      if (activeThreadId === threadId) {
        setActiveThreadId(remaining[0].id);
      }
    }
  };

  // Toggle pin
  const handleTogglePin = (threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, pinned: !t.pinned } : t))
    );
  };

  // Rename thread
  const handleRenameThread = (threadId: string, newTitle: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            title: newTitle,
            updatedAt: Date.now(),
            projectMemory: {
              ...t.projectMemory,
              projectName: newTitle,
            },
          };
        }
        return t;
      })
    );
  };

  // Select persona
  const handleSelectPersona = (personaId: CodingPersonaId) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThreadId ? { ...t, persona: personaId } : t))
    );
  };

  // Clear current messages
  const handleClearThread = () => {
    if (!confirm('Clear all chat messages in this session? (Your project workspace files will remain saved)')) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? { ...t, messages: [INITIAL_WELCOME_MESSAGE], updatedAt: Date.now() }
          : t
      )
    );
  };

  // Workspace File Operations
  const handleSelectFile = (fileId: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThreadId ? { ...t, activeFileId: fileId } : t))
    );
  };

  const handleUpdateFileContent = (fileId: string, newContent: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            files: t.files.map((f) =>
              f.id === fileId
                ? { ...f, content: newContent, updatedAt: Date.now(), size: new Blob([newContent]).size }
                : f
            ),
          };
        }
        return t;
      })
    );
  };

  const handleCreateFile = (filePath: string, content: string = '') => {
    const filename = filePath.split('/').pop() || filePath;
    const newFile: ProjectFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      path: filePath,
      name: filename,
      content,
      language: filePath.split('.').pop() || 'typescript',
      updatedAt: Date.now(),
      size: new Blob([content]).size,
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          // Replace if exists, or append
          const filtered = t.files.filter((f) => f.path !== filePath);
          return {
            ...t,
            files: [...filtered, newFile],
            activeFileId: newFile.id,
          };
        }
        return t;
      })
    );
  };

  const handleDeleteFile = (fileId: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          const remaining = t.files.filter((f) => f.id !== fileId);
          return {
            ...t,
            files: remaining,
            activeFileId: remaining[0]?.id || null,
          };
        }
        return t;
      })
    );
  };

  const handleRenameFile = (fileId: string, newPath: string) => {
    const filename = newPath.split('/').pop() || newPath;
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            files: t.files.map((f) =>
              f.id === fileId
                ? { ...f, path: newPath, name: filename, updatedAt: Date.now() }
                : f
            ),
          };
        }
        return t;
      })
    );
  };

  const handleImportFiles = (importedFiles: ProjectFile[]) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          const existingMap = new Map(t.files.map((f) => [f.path, f]));
          for (const imp of importedFiles) {
            existingMap.set(imp.path, imp);
          }
          const merged = Array.from(existingMap.values());
          return {
            ...t,
            files: merged,
            activeFileId: importedFiles[0]?.id || t.activeFileId,
          };
        }
        return t;
      })
    );
  };

  const handleUpdateMemory = (updatedMemory: ProjectMemory) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              title: updatedMemory.projectName || t.title,
              projectMemory: updatedMemory,
              updatedAt: Date.now(),
            }
          : t
      )
    );
  };

  // Trigger full project ZIP download
  const handleDownloadZip = async () => {
    if (!activeThread?.files || activeThread.files.length === 0) return;
    await downloadProjectZip(activeThread.files, activeThread.projectMemory?.projectName || activeThread.title);
  };

  // Open specific file in workspace
  const handleOpenFileInWorkspace = (file: ProjectFile) => {
    handleSelectFile(file.id);
    if (viewMode === 'chat') {
      setViewMode('split');
    }
  };

  // Select starter template
  const handleSelectTemplate = (template: typeof STARTER_TEMPLATES[0]) => {
    const filename = `src/components/${template.title.replace(/\s+/g, '')}.${template.language === 'typescript' ? 'tsx' : template.language}`;
    handleCreateFile(filename, template.snippet);
    if (viewMode === 'chat') {
      setViewMode('split');
    }
  };

  // Send message to assistant
  const handleSendMessage = async (userPrompt: string, attachedFiles?: AttachedFile[]) => {
    if (isStreaming) return;

    const startTime = Date.now();
    const userMessageId = `user-${Date.now()}`;
    const newUserMessage: ChatMessageType = {
      id: userMessageId,
      role: 'user',
      content: userPrompt,
      timestamp: startTime,
      attachedFiles,
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const initialAssistantMessage: ChatMessageType = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    // If thread title is default "New Coding Project", auto-generate title from first prompt
    const shouldUpdateTitle = activeThread.messages.length <= 1 || activeThread.title === 'New Coding Project';
    const cleanTitle = userPrompt.slice(0, 30).trim() || 'Coding Project';

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            title: shouldUpdateTitle ? cleanTitle : t.title,
            updatedAt: Date.now(),
            messages: [...t.messages, newUserMessage, initialAssistantMessage],
          };
        }
        return t;
      })
    );

    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const historyToSend = [...activeThread.messages, newUserMessage].map((m) => ({
        role: m.role,
        content: m.content,
        attachedFiles: m.attachedFiles,
      }));

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyToSend,
          personaPrompt: activePersona.systemPromptModifier,
          attachedFiles,
          projectFiles: activeThread.files,
          projectMemory: activeThread.projectMemory,
          temperature,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Readable stream not supported by server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let rawStreamBuffer = '';
      let streamBufferLine = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBufferLine += decoder.decode(value, { stream: true });
        const lines = streamBufferLine.split('\n');
        streamBufferLine = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.text) {
              rawStreamBuffer += data.text;
              
              // Live parse thinking & working steps in real-time
              const parsed = parseAIResponse(rawStreamBuffer, true);

              setThreads((prev) =>
                prev.map((t) => {
                  if (t.id === activeThreadId) {
                    return {
                      ...t,
                      messages: t.messages.map((m) =>
                        m.id === assistantMessageId
                          ? {
                              ...m,
                              content: parsed.cleanContent || (parsed.thinkingText ? '' : rawStreamBuffer),
                              thinkingText: parsed.thinkingText,
                              workingSteps: parsed.workingSteps,
                              deliverable: parsed.deliverable || undefined,
                              deliveredFiles: parsed.fileOperations.map((f) => ({
                                path: f.path,
                                language: f.language,
                                action: f.action === 'delete' ? 'delete' : 'create',
                              })),
                              isStreaming: true,
                            }
                          : m
                      ),
                    };
                  }
                  return t;
                })
              );
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (jsonErr) {
            // Partial chunk
          }
        }
      }

      const durationMs = Date.now() - startTime;
      const finalParsed = parseAIResponse(rawStreamBuffer, false);

      // Apply any file operations to the thread's workspace directory
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === activeThreadId) {
            const updatedFiles = finalParsed.fileOperations.length > 0
              ? applyFileOperations(t.files, finalParsed.fileOperations)
              : t.files;

            const updatedMemory: ProjectMemory = finalParsed.updatedMemory
              ? {
                  ...t.projectMemory,
                  ...finalParsed.updatedMemory,
                  projectName: finalParsed.updatedMemory.projectName || t.projectMemory.projectName,
                  lastUpdated: Date.now(),
                }
              : t.projectMemory;

            // Find first created/modified file to focus in editor
            const firstAffectedFile = finalParsed.fileOperations[0]?.path
              ? updatedFiles.find((f) => f.path === finalParsed.fileOperations[0].path)?.id
              : t.activeFileId;

            return {
              ...t,
              title: updatedMemory.projectName || t.title,
              files: updatedFiles,
              activeFileId: firstAffectedFile || t.activeFileId,
              projectMemory: updatedMemory,
              messages: t.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: finalParsed.cleanContent || 'Project files have been created/updated in your workspace directory.',
                      thinkingText: finalParsed.thinkingText,
                      workingSteps: finalParsed.workingSteps,
                      deliverable: finalParsed.deliverable || undefined,
                      deliveredFiles: finalParsed.fileOperations.map((f) => ({
                        path: f.path,
                        language: f.language,
                        action: f.action === 'delete' ? 'delete' : 'create',
                      })),
                      isStreaming: false,
                      stats: {
                        model: 'gemini-3.8-flash',
                        durationMs,
                      },
                    }
                  : m
              ),
            };
          }
          return t;
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setThreads((prev) =>
          prev.map((t) => {
            if (t.id === activeThreadId) {
              return {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === assistantMessageId ? { ...m, isStreaming: false } : m
                ),
              };
            }
            return t;
          })
        );
      } else {
        console.error('Streaming error:', err);
        setThreads((prev) =>
          prev.map((t) => {
            if (t.id === activeThreadId) {
              return {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        isStreaming: false,
                        error: err.message || 'Failed to complete AI response.',
                      }
                    : m
                ),
              };
            }
            return t;
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Stop streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  // Quick Action triggers from code block
  const handleQuickAction = (
    action: 'explain' | 'test' | 'refactor' | 'audit',
    code: string,
    language: string
  ) => {
    let prompt = '';
    switch (action) {
      case 'explain':
        prompt = `Please explain the following ${language} code step-by-step, including data flow, algorithmic complexity, and edge case handling:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;
      case 'test':
        prompt = `Write a comprehensive, production-grade unit test suite (with edge cases and mocking) for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;
      case 'refactor':
        prompt = `Refactor the following ${language} code to improve performance, readability, modularity, and strict type safety:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;
      case 'audit':
        prompt = `Perform a comprehensive security & bug risk audit on this ${language} code. Pinpoint any vulnerabilities, null pointer hazards, or injection vectors:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;
    }
    handleSendMessage(prompt);
  };

  // Export current thread as Markdown
  const handleExportMarkdown = () => {
    if (!activeThread) return;
    const content = activeThread.messages
      .map((m) => `### ${m.role === 'user' ? '👤 User' : '🤖 ' + activePersona.name} (${new Date(m.timestamp).toLocaleString()})\n\n${m.content}\n\n---`)
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeThread.projectMemory?.projectName || activeThread.title).replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export all threads as JSON
  const handleExportAllThreads = () => {
    const blob = new Blob([JSON.stringify(threads, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codeai-studio-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import threads
  const handleImportThreads = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setThreads(parsed);
        setActiveThreadId(parsed[0].id);
        alert('Chat sessions & workspaces imported successfully!');
      } else {
        alert('Invalid format for chat sessions file.');
      }
    } catch {
      alert('Failed to parse JSON file.');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d1117] text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        onTogglePinThread={handleTogglePin}
        onRenameThread={handleRenameThread}
        activePersona={activePersona}
        onSelectPersona={handleSelectPersona}
        onSelectTemplate={handleSelectTemplate}
        onExportAllThreads={handleExportAllThreads}
        onImportThreads={handleImportThreads}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
        onOpenSettings={() => setIsOpenSettingsModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <Header
          activeThread={activeThread}
          activePersona={activePersona}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onToggleMobileSidebar={() => setIsOpenMobileSidebar(true)}
          onClearThread={handleClearThread}
          onExportMarkdown={handleExportMarkdown}
          onOpenSettings={() => setIsOpenSettingsModal(true)}
          onOpenProjectMemory={() => setIsOpenMemoryModal(true)}
          onDownloadZip={handleDownloadZip}
        />

        {/* Dynamic Split Layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Chat Column */}
          {(viewMode === 'chat' || viewMode === 'split') && (
            <div
              className={`flex flex-col h-full overflow-hidden transition-all duration-200 ${
                viewMode === 'split' ? 'w-full lg:w-1/2 border-r border-slate-800' : 'w-full'
              }`}
            >
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
                {activeThread.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    persona={activePersona}
                    projectFiles={activeThread.files}
                    projectName={activeThread.projectMemory?.projectName || activeThread.title}
                    onOpenFileInWorkspace={handleOpenFileInWorkspace}
                    onOpenPreview={() => setViewMode(viewMode === 'split' ? 'split' : 'workspace')}
                    onQuickAction={handleQuickAction}
                    onRegenerate={() => {
                      const lastUserIndex = activeThread.messages.reduce(
                        (lastIdx, m, idx) => (m.role === 'user' ? idx : lastIdx),
                        -1
                      );
                      if (lastUserIndex !== -1) {
                        const lastUserPrompt = activeThread.messages[lastUserIndex].content;
                        handleSendMessage(lastUserPrompt);
                      }
                    }}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <ChatInput
                onSendMessage={handleSendMessage}
                onStopStreaming={handleStopStreaming}
                isStreaming={isStreaming}
                activePersona={activePersona}
                onOpenAttachModal={() => setIsOpenAttachModal(true)}
              />
            </div>
          )}

          {/* Project Workspace Column */}
          {(viewMode === 'workspace' || viewMode === 'split') && (
            <div
              className={`h-full overflow-hidden ${
                viewMode === 'split' ? 'hidden lg:flex lg:w-1/2 flex-col' : 'w-full flex flex-col'
              }`}
            >
              <ProjectWorkspace
                files={activeThread.files || []}
                activeFileId={activeThread.activeFileId || null}
                onSelectFile={handleSelectFile}
                onUpdateFileContent={handleUpdateFileContent}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                onImportFiles={handleImportFiles}
                projectMemory={activeThread.projectMemory || DEFAULT_PROJECT_MEMORY}
                onUpdateMemory={handleUpdateMemory}
                onClose={() => setViewMode('chat')}
                onSendPromptToChat={handleSendMessage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Project Memory Inspector Modal */}
      <ProjectMemoryModal
        isOpen={isOpenMemoryModal}
        onClose={() => setIsOpenMemoryModal(false)}
        memory={activeThread.projectMemory || DEFAULT_PROJECT_MEMORY}
        onSaveMemory={handleUpdateMemory}
      />

      {/* Attach Code Snippet Modal */}
      <FileAttachModal
        isOpen={isOpenAttachModal}
        onClose={() => setIsOpenAttachModal(false)}
        onAttachFile={(file) => {
          handleSendMessage(`I'm attaching the following code file (${file.name}):`, [file]);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isOpenSettingsModal}
        onClose={() => setIsOpenSettingsModal(false)}
        temperature={temperature}
        onChangeTemperature={setTemperature}
        onClearAllData={() => {
          localStorage.removeItem(STORAGE_KEY);
          handleNewThread();
        }}
      />
    </div>
  );
}
