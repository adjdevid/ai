import React, { useState } from 'react';
import { X, Code2, Plus, FileCode } from 'lucide-react';
import { AttachedFile } from '../types';

interface FileAttachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachFile: (file: AttachedFile) => void;
}

const COMMON_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'html',
  'css',
  'json',
  'sql',
  'go',
  'rust',
  'java',
  'cpp',
  'csharp',
  'bash',
  'yaml'
];

export function FileAttachModal({
  isOpen,
  onClose,
  onAttachFile,
}: FileAttachModalProps) {
  const [fileName, setFileName] = useState('snippet.ts');
  const [language, setLanguage] = useState('typescript');
  const [codeContent, setCodeContent] = useState('');

  if (!isOpen) return null;

  const handleAttach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeContent.trim()) return;

    const newFile: AttachedFile = {
      id: `attached-${Date.now()}`,
      name: fileName.trim() || `snippet-${Date.now()}.${language}`,
      language,
      content: codeContent.trim(),
      size: new Blob([codeContent]).size,
    };

    onAttachFile(newFile);
    setCodeContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-lg bg-[#161b22] border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-sm text-slate-100">Paste Code Snippet</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleAttach} className="p-4 space-y-3 flex-1 flex flex-col">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Virtual File Name
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. authMiddleware.ts"
                className="w-full bg-[#0d1117] text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#0d1117] text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-mono capitalize"
              >
                {COMMON_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Code Content
            </label>
            <textarea
              required
              rows={8}
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
              placeholder="// Paste your code or error logs here..."
              className="w-full flex-1 bg-[#0d1117] text-slate-200 text-xs p-3 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-mono resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!codeContent.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach to Chat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
