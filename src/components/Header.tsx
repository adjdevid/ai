import React from 'react';
import { 
  Menu, 
  Columns2, 
  MessageSquare, 
  Code2, 
  Trash2, 
  Download, 
  BrainCircuit, 
  Cpu, 
  Settings,
  FolderArchive,
  FolderTree
} from 'lucide-react';
import { CodingPersona, ChatThread } from '../types';

interface HeaderProps {
  activeThread: ChatThread;
  activePersona: CodingPersona;
  viewMode: 'chat' | 'split' | 'workspace';
  onChangeViewMode: (mode: 'chat' | 'split' | 'workspace') => void;
  onToggleMobileSidebar: () => void;
  onClearThread: () => void;
  onExportMarkdown: () => void;
  onOpenSettings: () => void;
  onOpenProjectMemory: () => void;
  onDownloadZip: () => void;
}

export function Header({
  activeThread,
  activePersona,
  viewMode,
  onChangeViewMode,
  onToggleMobileSidebar,
  onClearThread,
  onExportMarkdown,
  onOpenSettings,
  onOpenProjectMemory,
  onDownloadZip,
}: HeaderProps) {
  const fileCount = activeThread.files?.length || 0;

  return (
    <header className="h-13 bg-[#0d1117] border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between select-none shrink-0 z-30">
      {/* Left: Mobile Toggle & Thread Name & Project Memory Button */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate max-w-[140px] sm:max-w-[220px]">
            {activeThread.projectMemory?.projectName || activeThread.title}
          </span>

          {/* Project Memory Button */}
          <button
            type="button"
            onClick={onOpenProjectMemory}
            title="Open Project Memory & Context"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/70 text-blue-300 hover:bg-blue-900/80 border border-blue-800/50 text-[11px] font-medium transition-colors shrink-0"
          >
            <BrainCircuit className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">Memory</span>
          </button>

          {/* File Count Badge / Workspace Toggle */}
          <button
            type="button"
            onClick={() => onChangeViewMode(viewMode === 'workspace' ? 'split' : 'workspace')}
            title="View Project Directory Workspace"
            className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono transition-colors shrink-0"
          >
            <FolderTree className="w-3 h-3 text-indigo-400" />
            <span>{fileCount} files</span>
          </button>
        </div>
      </div>

      {/* Center: Model Status Badge */}
      <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#161b22] border border-slate-800 text-[11px] text-slate-400 font-mono">
        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-slate-200 font-medium">Gemini 3.8 Flash</span>
        <span className="text-slate-600">•</span>
        <span className="text-emerald-400 font-semibold">VFS & ZIP Ready</span>
      </div>

      {/* Right: Layout Toggle & Session Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Quick Download ZIP Button */}
        {fileCount > 0 && (
          <button
            type="button"
            onClick={onDownloadZip}
            title="Download full project folder as ZIP"
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-md shadow-sm transition-all text-xs"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ZIP</span>
          </button>
        )}

        {/* Layout View Toggles */}
        <div className="hidden sm:flex items-center bg-[#161b22] p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onChangeViewMode('chat')}
            title="Chat Only"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'chat'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Chat</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('split')}
            title="Split View (Chat + Workspace)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'split'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Split</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('workspace')}
            title="Working Directory Workspace Only"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'workspace'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Workspace</span>
          </button>
        </div>

        {/* Clear Thread Messages */}
        <button
          type="button"
          onClick={onClearThread}
          title="Clear current messages"
          className="p-1.5 sm:px-2.5 sm:py-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Studio Settings"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
