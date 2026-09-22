import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  RotateCcw, 
  Clock, 
  Cpu, 
  FileCode2,
  FolderArchive,
  Download
} from 'lucide-react';
import { ChatMessage as ChatMessageType, CodingPersona, ProjectFile } from '../types';
import { CodeBlock } from './CodeBlock';
import { ThinkingWorkingIndicator } from './ThinkingWorkingIndicator';
import { ProjectDeliverableCard } from './ProjectDeliverableCard';

interface ChatMessageProps {
  message: ChatMessageType;
  persona?: CodingPersona;
  projectFiles?: ProjectFile[];
  projectName?: string;
  onOpenInWorkspace?: (code: string, language: string, title?: string) => void;
  onOpenFileInWorkspace?: (file: ProjectFile) => void;
  onOpenPreview?: () => void;
  onQuickAction?: (action: 'explain' | 'test' | 'refactor' | 'audit', code: string, language: string) => void;
  onRegenerate?: () => void;
}

export function ChatMessage({
  message,
  persona,
  projectFiles = [],
  projectName = 'codeai-project',
  onOpenInWorkspace,
  onOpenFileInWorkspace,
  onOpenPreview,
  onQuickAction,
  onRegenerate,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`group relative py-4 px-3 sm:px-5 transition-colors ${
        isUser ? 'bg-[#161b22]/40' : 'bg-[#0e1217]'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3.5 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-slate-200 shadow-md border border-slate-600">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 border border-blue-400/30">
              <Bot className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Header info */}
          <div className="flex items-center justify-between gap-2 mb-1.5 select-none">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-slate-200">
                {isUser ? 'You' : (persona?.name || 'CodeAI Architect')}
              </span>
              {!isUser && persona && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/40">
                  {persona.tagline}
                </span>
              )}
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formattedTime}
              </span>
            </div>

            {/* Action buttons */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyMessage}
                title="Copy entire response"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {!isUser && onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  title="Regenerate response"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Attached Files Badges (if user message had attachments) */}
          {message.attachedFiles && message.attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-xs text-slate-300 shadow-sm"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-mono font-medium">{file.name}</span>
                  <span className="text-slate-500 text-[10px]">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Real-time Thinking & Working Process Indicator (Displays active files during processing) */}
          {!isUser && (message.thinkingText || (message.workingSteps && message.workingSteps.length > 0) || (message.deliveredFiles && message.deliveredFiles.length > 0) || message.isStreaming) && (
            <ThinkingWorkingIndicator
              isStreaming={message.isStreaming}
              thinkingText={message.thinkingText}
              workingSteps={message.workingSteps}
              activeFiles={message.deliveredFiles}
            />
          )}

          {/* Main Message Body */}
          <div className="text-slate-200 text-sm leading-relaxed overflow-hidden">
            {message.error ? (
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-sm space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="font-semibold px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 text-xs shrink-0">
                    Pemberitahuan
                  </span>
                  <span className="text-slate-200 text-xs sm:text-sm leading-relaxed">{message.error}</span>
                </div>
                {onRegenerate && (
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onRegenerate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-100 border border-rose-500/50 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Coba Kirim Ulang (Retry)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="markdown-body">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeContent = String(children).replace(/\n$/, '');
                      const isMultiLine = codeContent.includes('\n');

                      if (match || isMultiLine) {
                        return (
                          <CodeBlock
                            language={match ? match[1] : 'plaintext'}
                            code={codeContent}
                            onOpenInWorkspace={onOpenInWorkspace}
                            onQuickAction={onQuickAction}
                          />
                        );
                      }

                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </Markdown>
              </div>
            )}
          </div>

          {/* Interactive Project Deliverables & ZIP Package Card: ONLY shown when finished AND files were actually generated/modified */}
          {!isUser && !message.isStreaming && Boolean(
            (message.deliveredFiles && message.deliveredFiles.length > 0) ||
            (message.deliverable && (
              (message.deliverable.filesCreated && message.deliverable.filesCreated.length > 0) ||
              (message.deliverable.filesUpdated && message.deliverable.filesUpdated.length > 0)
            ))
          ) && (
            <ProjectDeliverableCard
              deliverable={message.deliverable}
              deliveredFiles={message.deliveredFiles}
              projectFiles={projectFiles}
              projectName={projectName}
              onOpenFileInWorkspace={(f) => {
                if (onOpenFileInWorkspace) {
                  onOpenFileInWorkspace(f);
                } else if (onOpenInWorkspace) {
                  onOpenInWorkspace(f.content, f.language, f.path);
                }
              }}
              onOpenPreview={() => {
                if (onOpenPreview) onOpenPreview();
              }}
            />
          )}

          {/* Assistant Metadata Footer */}
          {!isUser && !message.isStreaming && !message.error && (
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-emerald-400" />
                  Gemini 3.8 Flash • VFS & Memory Active
                </span>
                {message.stats?.durationMs && (
                  <span>{(message.stats.durationMs / 1000).toFixed(2)}s</span>
                )}
              </div>
              <span className="text-slate-400 font-semibold">ZIP Package Ready</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
