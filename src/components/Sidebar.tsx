import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Pin, 
  PinOff, 
  Edit2, 
  Check, 
  Search, 
  Sparkles, 
  Layers, 
  Bug, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  GraduationCap, 
  Code2, 
  Download, 
  Upload, 
  X,
  Settings,
  Terminal,
  Bookmark,
  ChevronRight
} from 'lucide-react';
import { ChatThread, CodingPersona, CodingPersonaId } from '../types';
import { CODING_PERSONAS, STARTER_TEMPLATES } from '../data/personas';

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  onTogglePinThread: (threadId: string) => void;
  onRenameThread: (threadId: string, newTitle: string) => void;
  activePersona: CodingPersona;
  onSelectPersona: (personaId: CodingPersonaId) => void;
  onSelectTemplate: (template: typeof STARTER_TEMPLATES[0]) => void;
  onExportAllThreads: () => void;
  onImportThreads: (jsonStr: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onTogglePinThread,
  onRenameThread,
  activePersona,
  onSelectPersona,
  onSelectTemplate,
  onExportAllThreads,
  onImportThreads,
  isOpenMobile,
  onCloseMobile,
  onOpenSettings,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'threads' | 'personas' | 'templates'>('threads');

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedThreads = filteredThreads.filter((t) => t.pinned);
  const recentThreads = filteredThreads.filter((t) => !t.pinned);

  const handleStartRename = (thread: ChatThread, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(thread.id);
    setEditTitle(thread.title);
  };

  const handleSaveRename = (threadId: string) => {
    if (editTitle.trim()) {
      onRenameThread(threadId, editTitle.trim());
    }
    setEditingThreadId(null);
  };

  const getPersonaIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers': return <Layers className="w-4 h-4" />;
      case 'Bug': return <Bug className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4" />;
      case 'CheckCircle2': return <CheckCircle2 className="w-4 h-4" />;
      case 'GraduationCap': return <GraduationCap className="w-4 h-4" />;
      default: return <Code2 className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-72 sm:w-80 bg-[#0e1217] border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & New Chat Header */}
        <div className="p-3.5 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-slate-100 tracking-tight flex items-center gap-1.5">
                  CodeAI Studio
                  <span className="text-[10px] px-1.5 py-0.2 font-mono font-medium rounded bg-blue-950 text-blue-400 border border-blue-800/60">
                    v3.8
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">Professional Coding Assistant</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-white rounded-md lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Action Button */}
          <button
            type="button"
            onClick={() => {
              onNewThread();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Coding Session</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 p-1.5 bg-[#161b22] border-b border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('threads')}
            className={`py-1.5 px-2 rounded-md transition-colors ${
              activeTab === 'threads'
                ? 'bg-[#0e1217] text-blue-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chats
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('personas')}
            className={`py-1.5 px-2 rounded-md transition-colors ${
              activeTab === 'personas'
                ? 'bg-[#0e1217] text-blue-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Personas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`py-1.5 px-2 rounded-md transition-colors ${
              activeTab === 'templates'
                ? 'bg-[#0e1217] text-blue-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Snippets
          </button>
        </div>

        {/* Tab 1: Chat Threads */}
        {activeTab === 'threads' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search Input */}
            <div className="p-2.5 border-b border-slate-800/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search code chats..."
                  className="w-full bg-[#161b22] text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-700/70 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Thread Lists */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {/* Pinned Section */}
              {pinnedThreads.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Bookmark className="w-3 h-3 text-amber-400" />
                    Pinned
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {pinnedThreads.map((thread) => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === activeThreadId}
                        isEditing={thread.id === editingThreadId}
                        editTitle={editTitle}
                        onSetEditTitle={setEditTitle}
                        onSaveRename={() => handleSaveRename(thread.id)}
                        onStartRename={(e) => handleStartRename(thread, e)}
                        onSelect={() => {
                          onSelectThread(thread.id);
                          if (isOpenMobile) onCloseMobile();
                        }}
                        onDelete={(e) => {
                          e.stopPropagation();
                          onDeleteThread(thread.id);
                        }}
                        onTogglePin={(e) => {
                          e.stopPropagation();
                          onTogglePinThread(thread.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Section */}
              <div>
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Recent Sessions
                </div>
                {recentThreads.length === 0 && pinnedThreads.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No sessions found. Start a new coding chat!
                  </div>
                ) : (
                  <div className="space-y-0.5 mt-1">
                    {recentThreads.map((thread) => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === activeThreadId}
                        isEditing={thread.id === editingThreadId}
                        editTitle={editTitle}
                        onSetEditTitle={setEditTitle}
                        onSaveRename={() => handleSaveRename(thread.id)}
                        onStartRename={(e) => handleStartRename(thread, e)}
                        onSelect={() => {
                          onSelectThread(thread.id);
                          if (isOpenMobile) onCloseMobile();
                        }}
                        onDelete={(e) => {
                          e.stopPropagation();
                          onDeleteThread(thread.id);
                        }}
                        onTogglePin={(e) => {
                          e.stopPropagation();
                          onTogglePinThread(thread.id);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Personas Selector */}
        {activeTab === 'personas' && (
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            <p className="text-[11px] text-slate-400 px-1">
              Select an expert persona to customize coding system guidelines and tone:
            </p>
            {CODING_PERSONAS.map((persona) => {
              const isSelected = activePersona.id === persona.id;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => onSelectPersona(persona.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/60 shadow-md ring-1 ring-blue-500/30'
                      : 'bg-[#161b22]/70 hover:bg-[#161b22] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md bg-gradient-to-tr ${persona.color} text-white shadow-sm`}>
                      {getPersonaIcon(persona.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-200 truncate">
                          {persona.name}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        )}
                      </div>
                      <span className="text-[11px] text-blue-400/90 block truncate">
                        {persona.tagline}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {persona.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 3: Starter Templates */}
        {activeTab === 'templates' && (
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            <p className="text-[11px] text-slate-400 px-1">
              Quickly load boilerplate code for sandbox execution or discussion:
            </p>
            {STARTER_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => {
                  onSelectTemplate(tmpl);
                  if (isOpenMobile) onCloseMobile();
                }}
                className="w-full text-left p-2.5 rounded-lg bg-[#161b22]/70 hover:bg-[#161b22] border border-slate-800 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-200 group-hover:text-blue-400">
                    {tmpl.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {tmpl.language}
                  </span>
                </div>
                <div className="mt-2 font-mono text-[10px] text-slate-500 bg-[#0d1117] p-1.5 rounded border border-slate-800 truncate">
                  {tmpl.snippet.split('\n')[0]}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#0a0d12] flex items-center justify-between text-xs text-slate-400 select-none">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportAllThreads}
              title="Export all chat sessions (JSON)"
              className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <label
              title="Import chat sessions"
              className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target?.result as string;
                    if (text) onImportThreads(text);
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 px-2 py-1 rounded transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}

interface ThreadItemProps {
  thread: ChatThread;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onSetEditTitle: (val: string) => void;
  onSaveRename: () => void;
  onStartRename: (e: React.MouseEvent) => void;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onTogglePin: (e: React.MouseEvent) => void;
}

function ThreadItem({
  thread,
  isActive,
  isEditing,
  editTitle,
  onSetEditTitle,
  onSaveRename,
  onStartRename,
  onSelect,
  onDelete,
  onTogglePin,
}: ThreadItemProps) {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
        isActive
          ? 'bg-blue-600/15 text-blue-300 font-medium border border-blue-500/30'
          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onSetEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveRename();
              if (e.key === 'Escape') onSaveRename();
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="w-full bg-[#161b22] text-white text-xs px-1.5 py-0.5 rounded border border-blue-500 focus:outline-none"
          />
        ) : (
          <span className="truncate">{thread.title}</span>
        )}
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
        {isEditing ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSaveRename();
            }}
            className="p-1 text-emerald-400 hover:text-emerald-300"
          >
            <Check className="w-3 h-3" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onTogglePin}
              title={thread.pinned ? 'Unpin' : 'Pin to top'}
              className="p-1 text-slate-400 hover:text-amber-400"
            >
              {thread.pinned ? <PinOff className="w-3 h-3 text-amber-400" /> : <Pin className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={onStartRename}
              title="Rename session"
              className="p-1 text-slate-400 hover:text-white"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Delete session"
              className="p-1 text-slate-400 hover:text-rose-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
