import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Cog, 
  CheckCircle2, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  FileCode2,
  FolderGit2
} from 'lucide-react';
import { AIWorkingStep } from '../types';

interface ThinkingWorkingIndicatorProps {
  isStreaming?: boolean;
  thinkingText?: string;
  workingSteps?: AIWorkingStep[];
  activeFiles?: Array<{ path: string; language?: string; action?: 'create' | 'edit' | 'delete' }>;
}

export function ThinkingWorkingIndicator({
  isStreaming = false,
  thinkingText = '',
  workingSteps = [],
  activeFiles = [],
}: ThinkingWorkingIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(isStreaming);

  if (!thinkingText && workingSteps.length === 0 && activeFiles.length === 0 && !isStreaming) {
    return null;
  }

  const completedStepsCount = workingSteps.filter((s) => s.status === 'completed').length;
  const totalSteps = workingSteps.length;

  return (
    <div className="mb-4 rounded-xl border border-slate-800 bg-[#0c121e]/90 shadow-lg overflow-hidden transition-all duration-200 backdrop-blur-sm">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 hover:bg-slate-800/80 cursor-pointer select-none border-b border-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center">
            <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              {isStreaming ? (
                <BrainCircuit className="w-3.5 h-3.5 animate-pulse text-blue-300" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              )}
            </div>
            {isStreaming && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-xs text-slate-200">
              {isStreaming ? 'Proses: Sedang Memproses & Menulis Berkas...' : 'Riwayat Proses Eksekusi'}
            </span>
            {activeFiles.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/50 font-mono">
                {activeFiles.length} berkas aktif
              </span>
            )}
            {totalSteps > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {completedStepsCount}/{totalSteps} langkah
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {isExpanded ? 'Tutup Rincian' : 'Lihat Rincian'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Accordion Body */}
      {isExpanded && (
        <div className="p-3.5 space-y-3 text-xs">
          {/* Active File Operations during Streaming ("Saat Proses") */}
          {activeFiles.length > 0 && (
            <div className="p-2.5 rounded-lg bg-[#111827]/80 border border-blue-900/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-semibold text-blue-300 text-[11px] uppercase tracking-wider">
                  <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Berkas yang Sedang Dikerjakan</span>
                </div>
                {isStreaming && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Menulis aktif...
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {activeFiles.map((file, idx) => (
                  <div
                    key={`${file.path}-${idx}`}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded bg-[#0b0f19] border border-slate-800/80 text-slate-200 font-mono text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{file.path}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                      file.action === 'delete'
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                        : file.action === 'edit'
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                    }`}>
                      {file.action === 'delete' ? 'Hapus' : file.action === 'edit' ? 'Edit' : 'Tulis'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thinking Stream section */}
          {thinkingText && (
            <div className="p-3 rounded-lg bg-[#090e17] border border-slate-800 text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-blue-400 mb-1.5 uppercase tracking-wider text-[10px]">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Analisis & Rencana Arsitektur</span>
              </div>
              <p className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-300 pl-1 border-l-2 border-blue-500/40">
                {thinkingText}
              </p>
            </div>
          )}

          {/* Working Steps checklist */}
          {workingSteps.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-400 mb-1 text-[10px] uppercase tracking-wider">
                <Cog className="w-3.5 h-3.5 text-slate-400" />
                <span>Langkah Operasi</span>
              </div>

              {workingSteps.map((step) => {
                const isRunning = step.status === 'running';
                const isDone = step.status === 'completed';

                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border transition-colors ${
                      isRunning
                        ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                        : isDone
                        ? 'bg-[#0f1724]/60 border-slate-800 text-slate-300'
                        : 'bg-transparent border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isRunning ? (
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                      ) : isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-slate-200">{step.title}</div>
                      {step.detail && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {step.detail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active indicator when still streaming */}
          {isStreaming && (
            <div className="flex items-center gap-2 text-[11px] text-blue-400 font-mono pt-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>Menerapkan perubahan direktori & mengompilasi keluaran...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
