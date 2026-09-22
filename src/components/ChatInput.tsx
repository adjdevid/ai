import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Square, 
  Paperclip, 
  Sparkles, 
  X, 
  FileCode2, 
  Code2, 
  HelpCircle,
  Zap,
  CheckCircle2,
  Bug,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { AttachedFile, CodingPersona, QuickPrompt } from '../types';
import { QUICK_PROMPTS } from '../data/quickPrompts';
import { detectLanguageFromFilename } from '../utils/codeParser';

interface ChatInputProps {
  onSendMessage: (content: string, attachedFiles?: AttachedFile[]) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  activePersona: CodingPersona;
  onOpenAttachModal: () => void;
}

export function ChatInput({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  activePersona,
  onOpenAttachModal,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 220)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStreaming) {
      onStopStreaming();
      return;
    }
    if (!input.trim() && attachedFiles.length === 0) return;

    onSendMessage(input.trim(), attachedFiles.length > 0 ? attachedFiles : undefined);
    setInput('');
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const newAttachedFile: AttachedFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          language: detectLanguageFromFilename(file.name),
          content: content || '',
          size: file.size,
        };
        setAttachedFiles((prev) => [...prev, newAttachedFile]);
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachedFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleApplyQuickPrompt = (prompt: QuickPrompt) => {
    setInput(prompt.promptTemplate);
    setShowQuickPrompts(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="relative border-t border-slate-800 bg-[#0d1117] p-3 sm:p-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        accept=".js,.ts,.tsx,.jsx,.py,.html,.css,.json,.sql,.go,.rs,.java,.cpp,.c,.cs,.kt,.swift,.php,.rb,.sh,.yaml,.yml,.md,.txt"
      />

      {/* Quick Prompts Drawer / Bar */}
      <div className="max-w-4xl mx-auto mb-2">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowQuickPrompts(!showQuickPrompts)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                showQuickPrompts 
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/40' 
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Coding Prompts</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
            {QUICK_PROMPTS.slice(0, 5).map((qp) => (
              <button
                key={qp.id}
                type="button"
                onClick={() => handleApplyQuickPrompt(qp)}
                className="whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/70 transition-colors flex items-center gap-1"
              >
                <span>{qp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Expanded Quick Prompts List */}
        {showQuickPrompts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 p-3 bg-[#161b22] rounded-xl border border-slate-700 shadow-xl animate-in fade-in zoom-in-95 duration-100">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.id}
                type="button"
                onClick={() => handleApplyQuickPrompt(qp)}
                className="text-left p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600 transition-all flex items-start justify-between group"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-200 group-hover:text-blue-400 flex items-center gap-1.5">
                    <span>{qp.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {qp.description}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Attached Files List */}
      {attachedFiles.length > 0 && (
        <div className="max-w-4xl mx-auto mb-2 flex flex-wrap gap-2">
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-700/50 text-xs text-blue-200 shadow-sm"
            >
              <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono font-medium max-w-[180px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachedFile(file.id)}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-700/50"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Box */}
      <div className="max-w-4xl mx-auto relative bg-[#161b22] rounded-xl border border-slate-700/80 focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-lg transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask ${activePersona.name} for code generation, bug fixing, refactoring, or preview (Shift+Enter for newline)...`}
          rows={1}
          className="w-full bg-transparent px-4 pt-3.5 pb-12 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none font-sans"
        />

        {/* Bottom toolbar */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between select-none">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {/* Attach File / Snippet Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach code file"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-300 border border-slate-700 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Attach Code</span>
            </button>

            {/* Paste Snippet Modal Button */}
            <button
              type="button"
              onClick={onOpenAttachModal}
              title="Paste raw code snippet"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-300 border border-slate-700 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Paste Snippet</span>
            </button>

            <span className="text-[11px] text-slate-500 font-mono hidden md:inline ml-2">
              Shift + Enter for new line
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!input.trim() && attachedFiles.length === 0}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all ${
                  input.trim() || attachedFiles.length > 0
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
