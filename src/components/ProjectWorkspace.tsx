import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderTree, 
  FolderPlus, 
  FilePlus, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  Code2, 
  Play, 
  Eye, 
  Zap, 
  CheckCircle2, 
  Terminal, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  BrainCircuit, 
  Maximize2, 
  Minimize2, 
  X, 
  FileCode, 
  Folder, 
  ChevronRight, 
  ChevronDown,
  FolderArchive,
  Save,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { ProjectFile, ProjectMemory, AnalysisResult } from '../types';
import { downloadProjectZip, downloadSingleFile, unzipProjectFiles, formatBytes } from '../utils/zipUtils';
import { detectLanguageFromFilename, getFileExtension } from '../utils/codeParser';

interface ProjectWorkspaceProps {
  files: ProjectFile[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onUpdateFileContent: (fileId: string, newContent: string) => void;
  onCreateFile: (path: string, content?: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newPath: string) => void;
  onImportFiles: (importedFiles: ProjectFile[]) => void;
  projectMemory: ProjectMemory;
  onUpdateMemory: (memory: ProjectMemory) => void;
  onClose: () => void;
  onSendPromptToChat: (prompt: string) => void;
}

export function ProjectWorkspace({
  files,
  activeFileId,
  onSelectFile,
  onUpdateFileContent,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onImportFiles,
  projectMemory,
  onUpdateMemory,
  onClose,
  onSendPromptToChat,
}: ProjectWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'memory' | 'analysis' | 'tests' | 'console'>('editor');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  
  // File creation / rename modal / inline states
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('src/App.tsx');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editFilePath, setEditFilePath] = useState('');

  // Expanded folders in tree
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '': true,
    'src': true,
    'src/components': true,
  });

  // Console output from preview sandbox
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: 'log' | 'error' | 'warn' | 'info'; message: string; timestamp: string }>>([]);

  // Deep Analysis state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Unit Test state
  const [generatedTests, setGeneratedTests] = useState<string | null>(null);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0] || null;

  // Auto-switch to preview tab if files change and index.html is loaded
  useEffect(() => {
    if (files.length > 0 && !activeFileId) {
      onSelectFile(files[0].id);
    }
  }, [files, activeFileId, onSelectFile]);

  const handleCopy = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadZip = async () => {
    if (files.length === 0) return;
    setIsZipping(true);
    try {
      await downloadProjectZip(files, projectMemory.projectName || 'project');
    } catch (err) {
      console.error('ZIP error:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;
    onCreateFile(newFilePath.trim(), '');
    setNewFilePath('');
    setIsCreatingFile(false);
  };

  const handleSaveRename = (fileId: string) => {
    if (editFilePath.trim()) {
      onRenameFile(fileId, editFilePath.trim());
    }
    setEditingFileId(null);
  };

  // Run AI Code Analysis on active file
  const handleRunAnalysis = async () => {
    if (!activeFile) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/code/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language || 'typescript',
        }),
      });
      if (!res.ok) throw new Error('Analysis request failed');
      const data = await res.json();
      setAnalysisResult(data);
      setActiveTab('analysis');
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to complete analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate Unit Tests for active file
  const handleGenerateTests = async () => {
    if (!activeFile) return;
    setIsGeneratingTests(true);
    try {
      const res = await fetch('/api/code/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language || 'typescript',
        }),
      });
      if (!res.ok) throw new Error('Test generation failed');
      const data = await res.json();
      setGeneratedTests(data.testCode);
      setActiveTab('tests');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGeneratingTests(false);
    }
  };

  // Build bundled HTML for live preview sandbox
  const getCombinedPreviewHtml = () => {
    // Find index.html or primary HTML file
    const htmlFile = files.find((f) => f.path.endsWith('.html') || f.path === 'index.html') || files.find((f) => f.language === 'html');
    
    // Find CSS files
    const cssFiles = files.filter((f) => f.path.endsWith('.css') || f.language === 'css');
    const combinedCss = cssFiles.map((f) => f.content).join('\n\n');

    // Find JS / TS files
    const jsFiles = files.filter((f) => (f.language === 'javascript' || f.language === 'typescript') && !f.path.includes('.test.') && !f.path.includes('.spec.'));
    const combinedJs = jsFiles.map((f) => f.content).join('\n\n');

    let baseHtml = htmlFile ? htmlFile.content : '';

    if (!baseHtml) {
      if (activeFile && (activeFile.language === 'javascript' || activeFile.language === 'html')) {
        baseHtml = activeFile.content;
      } else {
        baseHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 p-6 font-sans">
  <div class="max-w-xl mx-auto text-center py-10">
    <h2 class="text-xl font-bold mb-2 text-blue-400">${projectMemory.projectName || 'Project Preview'}</h2>
    <p class="text-slate-400 text-sm mb-4">${projectMemory.description || 'Interactive project sandbox container'}</p>
    <div id="root" class="bg-[#161b22] p-4 rounded-xl border border-slate-800 text-left">
      <p class="text-xs text-slate-500 font-mono">Select or create index.html in the workspace to view custom UI.</p>
    </div>
  </div>
</body>
</html>`;
      }
    }

    // If CSS is present, inject styles
    if (combinedCss && !baseHtml.includes(combinedCss)) {
      baseHtml = baseHtml.replace('</head>', `<style>\n${combinedCss}\n</style></head>`);
    }

    // Inject console interceptor
    const consoleInterceptor = `
      <script>
        (function() {
          function sendLog(type, args) {
            window.parent.postMessage({
              type: 'CODEAI_WORKSPACE_LOG',
              logType: type,
              message: Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
            }, '*');
          }
          const origLog = console.log;
          const origWarn = console.warn;
          const origErr = console.error;
          console.log = function(...args) { origLog.apply(console, args); sendLog('log', args); };
          console.warn = function(...args) { origWarn.apply(console, args); sendLog('warn', args); };
          console.error = function(...args) { origErr.apply(console, args); sendLog('error', args); };
          window.onerror = function(msg, url, line) {
            sendLog('error', [msg + ' (line ' + line + ')']);
          };
        })();
      </script>
    `;

    return baseHtml.replace('<head>', `<head>${consoleInterceptor}`);
  };

  // Console listener from iframe
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CODEAI_WORKSPACE_LOG') {
        setConsoleLogs((prev) => [
          ...prev,
          {
            type: e.data.logType || 'log',
            message: e.data.message || '',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  // Group files by top-level folders for tree presentation
  const organizedFiles = files.reduce((acc, file) => {
    const parts = file.path.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(file);
    return acc;
  }, {} as Record<string, ProjectFile[]>);

  const folderNames = Object.keys(organizedFiles).sort((a, b) => {
    if (a === '') return -1;
    if (b === '') return 1;
    return a.localeCompare(b);
  });

  const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);

  return (
    <div className={`flex flex-col h-full bg-[#0b0f17] border-l border-slate-800 ${isFullScreen ? 'fixed inset-0 z-50' : 'relative'}`}>
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#121722] border-b border-slate-800 text-xs text-slate-300 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <FolderTree className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 truncate text-xs">
                {projectMemory.projectName || 'Project Workspace'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-950/80 text-blue-400 rounded border border-blue-800/50">
                {files.length} files ({formatBytes(totalBytes)})
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-1.5">
          {/* Download Entire Project ZIP */}
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={files.length === 0 || isZipping}
            title="Download entire project directory as ZIP"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-md shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isZipping ? 'Zipping...' : 'Download ZIP'}</span>
          </button>

          {/* Upload Files / ZIP */}
          <label
            title="Upload external files or ZIP project"
            className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Import</span>
            <input
              type="file"
              accept=".zip,.ts,.tsx,.js,.jsx,.html,.css,.json,.py,.go,.rs,.md"
              multiple
              className="hidden"
              onChange={async (e) => {
                const uploaded = e.target.files;
                if (!uploaded || uploaded.length === 0) return;

                if (uploaded[0].name.endsWith('.zip')) {
                  try {
                    const unzipped = await unzipProjectFiles(uploaded[0]);
                    if (unzipped.length > 0) {
                      onImportFiles(unzipped);
                    }
                  } catch (err) {
                    console.error('Failed to parse zip:', err);
                  }
                } else {
                  // Text files
                  const imported: ProjectFile[] = [];
                  for (let i = 0; i < uploaded.length; i++) {
                    const file = uploaded[i];
                    const content = await file.text();
                    imported.push({
                      id: `file-${Date.now()}-${i}`,
                      path: file.name,
                      name: file.name,
                      content,
                      language: detectLanguageFromFilename(file.name),
                      updatedAt: Date.now(),
                      size: file.size,
                    });
                  }
                  if (imported.length > 0) {
                    onImportFiles(imported);
                  }
                }
              }}
            />
          </label>

          {/* Full Screen toggle */}
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            title="Close workspace"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Sidebar Explorer + Workspace Content) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Directory File Explorer */}
        <div className="w-56 sm:w-64 bg-[#0d1117] border-r border-slate-800 flex flex-col shrink-0 select-none">
          {/* Explorer Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Project Files</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsCreatingFile(true)}
                title="New File"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Create File Input Dialog */}
          {isCreatingFile && (
            <form onSubmit={handleCreateFileSubmit} className="p-2 border-b border-slate-800 bg-[#161b22]">
              <input
                type="text"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                placeholder="path/to/file.tsx"
                autoFocus
                className="w-full bg-[#0d1117] text-slate-100 text-xs px-2 py-1 rounded border border-blue-500 focus:outline-none font-mono"
              />
              <div className="flex justify-end gap-1 mt-1.5">
                <button
                  type="button"
                  onClick={() => setIsCreatingFile(false)}
                  className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2 py-0.5 text-[10px] bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* File Tree List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-2 text-xs">
            {files.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-slate-500">
                Workspace directory is empty. Ask AI or click + to create files!
              </div>
            ) : (
              folderNames.map((folder) => {
                const folderFiles = organizedFiles[folder];
                const isRoot = folder === '';
                const isExpanded = isRoot || Boolean(expandedFolders[folder]);

                return (
                  <div key={folder || 'root'} className="space-y-0.5">
                    {!isRoot && (
                      <div
                        onClick={() => toggleFolder(folder)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 cursor-pointer font-mono text-[11px]"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <Folder className="w-3.5 h-3.5 text-blue-400" />
                        <span className="truncate">{folder}</span>
                      </div>
                    )}

                    {isExpanded && (
                      <div className={!isRoot ? 'pl-3.5 space-y-0.5' : 'space-y-0.5'}>
                        {folderFiles.map((file) => {
                          const isActive = file.id === activeFileId;
                          const isEditing = editingFileId === file.id;

                          return (
                            <div
                              key={file.id}
                              onClick={() => onSelectFile(file.id)}
                              className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                isActive
                                  ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/40'
                                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                                <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editFilePath}
                                    onChange={(e) => setEditFilePath(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveRename(file.id);
                                      if (e.key === 'Escape') setEditingFileId(null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="w-full bg-[#161b22] text-white text-xs px-1 py-0.5 rounded border border-blue-500 font-mono"
                                  />
                                ) : (
                                  <span className="truncate font-mono">{file.name}</span>
                                )}
                              </div>

                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                                {isEditing ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaveRename(file.id);
                                    }}
                                    className="p-1 text-emerald-400 hover:text-emerald-300"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingFileId(file.id);
                                        setEditFilePath(file.path);
                                      }}
                                      title="Rename path"
                                      className="p-1 text-slate-400 hover:text-white"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadSingleFile(file);
                                      }}
                                      title="Download file"
                                      className="p-1 text-slate-400 hover:text-white"
                                    >
                                      <Download className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete file ${file.path}?`)) {
                                          onDeleteFile(file.id);
                                        }
                                      }}
                                      title="Delete file"
                                      className="p-1 text-slate-400 hover:text-rose-400"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Project Memory Summary at bottom of explorer */}
          <div
            onClick={() => setActiveTab('memory')}
            className="p-3 border-t border-slate-800 bg-[#090d14] hover:bg-[#121824] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
              <BrainCircuit className="w-4 h-4 text-blue-400" />
              <span>Project Memory</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 font-mono">
              {projectMemory.techStack?.join(', ') || 'Requirements & Architecture'}
            </p>
          </div>
        </div>

        {/* Right: Workspace Tabs & Editor / Live Sandbox */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#090d13]">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1217] border-b border-slate-800 overflow-x-auto text-xs select-none">
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'editor'
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Editor {activeFile ? `(${activeFile.name})` : ''}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Sandbox</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('memory')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'memory'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                <span>Memory</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('analysis')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'analysis'
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Big-O & Audit</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tests')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'tests'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Unit Tests</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('console')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'console'
                    ? 'bg-slate-700/60 text-slate-200 border border-slate-600'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Console</span>
                {consoleLogs.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                    {consoleLogs.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick AI Refactor Action on active file */}
            {activeFile && (
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSendPromptToChat(`Please inspect, optimize, and update ${activeFile.path}:\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\``)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-300 bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/50 rounded-md transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>Ask AI to Edit File</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab View Contents */}
          <div className="flex-1 overflow-hidden relative">
            {/* Editor Tab */}
            {activeTab === 'editor' && (
              <div className="h-full flex flex-col">
                {activeFile ? (
                  <>
                    <div className="px-4 py-1.5 bg-[#121722] border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 select-none">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-200 font-medium">{activeFile.path}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {activeFile.language}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">Copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadSingleFile(activeFile)}
                          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Download</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={activeFile.content}
                      onChange={(e) => onUpdateFileContent(activeFile.id, e.target.value)}
                      className="flex-1 w-full bg-[#0d1117] text-slate-100 p-4 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-blue-600/30"
                      spellCheck={false}
                    />

                    <div className="px-4 py-2 bg-[#121722] border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between select-none">
                      <span className="font-mono">
                        {activeFile.content.split('\n').length} lines • {activeFile.content.length} characters
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium text-xs shadow transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run Live Sandbox</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
                    <FileCode className="w-12 h-12 text-slate-700 mb-2" />
                    <p>Select or create a file in the left directory tree.</p>
                  </div>
                )}
              </div>
            )}

            {/* Live Sandbox Tab */}
            {activeTab === 'preview' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 bg-white relative">
                  <iframe
                    ref={iframeRef}
                    title="CodeAI Sandbox Preview"
                    srcDoc={getCombinedPreviewHtml()}
                    sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
                    className="w-full h-full border-0"
                  />
                </div>
                <div className="px-3 py-2 bg-[#121722] border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between select-none">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Multi-File Project Sandbox Mounted
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (iframeRef.current) {
                        iframeRef.current.srcdoc = getCombinedPreviewHtml();
                      }
                    }}
                    className="flex items-center gap-1 text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reload Sandbox</span>
                  </button>
                </div>
              </div>
            )}

            {/* Project Memory Tab */}
            {activeTab === 'memory' && (
              <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
                <div className="p-4 bg-[#121722] border border-blue-900/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-blue-400" />
                      <h4 className="font-bold text-sm text-slate-100">Project Context Memory</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      Synchronized with AI
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    This persistent memory is automatically injected into every prompt so the AI retains architecture rules, tech stack decisions, and progress tracking across all sessions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#121722] border border-slate-800 rounded-xl">
                    <span className="font-semibold text-slate-200 block mb-1">Project Name</span>
                    <p className="text-sm font-bold text-blue-400 font-mono">{projectMemory.projectName || 'Untitled'}</p>
                  </div>
                  <div className="p-4 bg-[#121722] border border-slate-800 rounded-xl">
                    <span className="font-semibold text-slate-200 block mb-1">Tech Stack</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {projectMemory.techStack?.map((t, i) => (
                        <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#121722] border border-slate-800 rounded-xl">
                  <span className="font-semibold text-slate-200 block mb-1">Architecture Notes</span>
                  <p className="text-slate-300 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                    {projectMemory.architectureNotes || 'No architecture notes recorded yet.'}
                  </p>
                </div>

                {projectMemory.keyDecisions && projectMemory.keyDecisions.length > 0 && (
                  <div className="p-4 bg-[#121722] border border-slate-800 rounded-xl">
                    <span className="font-semibold text-emerald-400 block mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Key Decisions
                    </span>
                    <ul className="space-y-1 text-slate-300">
                      {projectMemory.keyDecisions.map((dec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400">•</span>
                          <span>{dec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Big-O Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4">
                {!analysisResult && !isAnalyzing && (
                  <div className="text-center py-10">
                    <Zap className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                    <h4 className="text-base font-semibold text-slate-200">
                      Audit {activeFile?.name || 'Code File'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Evaluate algorithmic Time & Space complexity (Big-O), security vectors, maintainability rating, and potential bugs.
                    </p>
                    <button
                      type="button"
                      onClick={handleRunAnalysis}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-xs rounded-lg shadow-lg shadow-amber-600/20 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Run Code Audit</span>
                    </button>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-slate-300 font-mono">Analyzing algorithmic complexity & security vectors...</p>
                  </div>
                )}

                {analysisResult && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-[#121722] border border-slate-800 rounded-xl">
                        <span className="text-[11px] text-slate-400 font-medium">Time Complexity</span>
                        <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                          {analysisResult.timeComplexity}
                        </div>
                      </div>
                      <div className="p-3 bg-[#121722] border border-slate-800 rounded-xl">
                        <span className="text-[11px] text-slate-400 font-medium">Space Complexity</span>
                        <div className="text-base font-bold text-blue-400 font-mono mt-0.5">
                          {analysisResult.spaceComplexity}
                        </div>
                      </div>
                      <div className="p-3 bg-[#121722] border border-slate-800 rounded-xl">
                        <span className="text-[11px] text-slate-400 font-medium">Security Score</span>
                        <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                          {analysisResult.securityScore} / 100
                        </div>
                      </div>
                      <div className="p-3 bg-[#121722] border border-slate-800 rounded-xl">
                        <span className="text-[11px] text-slate-400 font-medium">Maintainability</span>
                        <div className="text-base font-bold text-indigo-400 font-mono mt-0.5">
                          {analysisResult.maintainabilityScore} / 100
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#121722] border border-slate-800 rounded-xl">
                      <h5 className="text-xs font-semibold text-blue-400 mb-2">Optimization Suggestions</h5>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {analysisResult.suggestions.map((sug, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-400 font-bold">•</span>
                            <span>{sug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Unit Tests Tab */}
            {activeTab === 'tests' && (
              <div className="h-full flex flex-col">
                {!generatedTests && !isGeneratingTests && (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <CheckCircle2 className="w-12 h-12 text-purple-400 mb-3" />
                    <h4 className="text-base font-semibold text-slate-200">
                      Automated Tests for {activeFile?.name || 'File'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Generate comprehensive unit tests covering edge cases, happy paths, and boundary conditions.
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateTests}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-purple-600/20 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Test Suite</span>
                    </button>
                  </div>
                )}

                {isGeneratingTests && (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs text-slate-300 font-mono">Writing comprehensive unit tests...</p>
                  </div>
                )}

                {generatedTests && (
                  <div className="flex-1 flex flex-col">
                    <div className="px-4 py-2 bg-[#121722] border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 select-none">
                      <span className="font-mono text-purple-300 font-medium">test.spec.{getFileExtension(activeFile?.language || 'ts')}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const testPath = `tests/${activeFile?.name.replace(/\.[^.]+$/, '')}.test.${getFileExtension(activeFile?.language || 'ts')}`;
                          onCreateFile(testPath, generatedTests);
                          setActiveTab('editor');
                        }}
                        className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save as Project File</span>
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={generatedTests}
                      className="flex-1 w-full bg-[#0d1117] text-slate-100 p-4 font-mono text-xs leading-relaxed focus:outline-none resize-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Console Tab */}
            {activeTab === 'console' && (
              <div className="h-full flex flex-col bg-[#090d14]">
                <div className="px-4 py-2 bg-[#121722] border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 select-none">
                  <span className="font-mono">Sandbox Console Stream ({consoleLogs.length} logs)</span>
                  <button
                    type="button"
                    onClick={() => setConsoleLogs([])}
                    className="hover:text-white transition-colors"
                  >
                    Clear Console
                  </button>
                </div>
                <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1.5">
                  {consoleLogs.length === 0 ? (
                    <div className="text-slate-600 italic py-6 text-center">No console output recorded yet.</div>
                  ) : (
                    consoleLogs.map((log, i) => (
                      <div
                        key={i}
                        className={`p-1.5 rounded flex items-start gap-2 ${
                          log.type === 'error'
                            ? 'bg-rose-950/40 text-rose-300 border border-rose-900/50'
                            : log.type === 'warn'
                            ? 'bg-amber-950/40 text-amber-300 border border-amber-900/50'
                            : 'text-slate-300'
                        }`}
                      >
                        <span className="text-slate-600 text-[10px] shrink-0">{log.timestamp}</span>
                        <span className="break-all">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
