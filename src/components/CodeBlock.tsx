import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Copy, 
  Play, 
  ExternalLink, 
  Download, 
  Sparkles, 
  Bug, 
  Zap, 
  ShieldCheck, 
  ChevronDown,
  FileCode,
  ListOrdered
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // for HTML/XML
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-yaml';
import { getFileExtension } from '../utils/codeParser';

interface CodeBlockProps {
  language?: string;
  code: string;
  onOpenInWorkspace?: (code: string, language: string, title?: string) => void;
  onQuickAction?: (action: 'explain' | 'test' | 'refactor' | 'audit', code: string, language: string) => void;
}

export function CodeBlock({ language = 'plaintext', code, onOpenInWorkspace, onQuickAction }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');

  const cleanLang = (language || 'plaintext').toLowerCase().trim();
  const isRunnable = ['html', 'javascript', 'js', 'typescript', 'ts'].includes(cleanLang) ||
    code.includes('<!DOCTYPE html>') || code.includes('<html>');

  useEffect(() => {
    let grammar = Prism.languages[cleanLang];
    if (!grammar) {
      if (cleanLang === 'ts' || cleanLang === 'typescript') grammar = Prism.languages.typescript;
      else if (cleanLang === 'js' || cleanLang === 'javascript') grammar = Prism.languages.javascript;
      else if (cleanLang === 'py' || cleanLang === 'python') grammar = Prism.languages.python;
      else if (cleanLang === 'sh' || cleanLang === 'bash' || cleanLang === 'shell') grammar = Prism.languages.bash;
      else if (cleanLang === 'html' || cleanLang === 'xml') grammar = Prism.languages.markup;
      else grammar = Prism.languages.plaintext || Prism.languages.markup;
    }

    try {
      if (grammar) {
        const highlighted = Prism.highlight(code, grammar, cleanLang);
        setHighlightedCode(highlighted);
      } else {
        setHighlightedCode(escapeHtml(code));
      }
    } catch {
      setHighlightedCode(escapeHtml(code));
    }
  }, [code, cleanLang]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const ext = getFileExtension(cleanLang);
    const filename = `snippet-${Date.now()}.${ext}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lines = code.split('\n');

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-slate-700/70 bg-[#0d1117] shadow-xl text-xs sm:text-sm font-mono">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#161b22] border-b border-slate-700/60 text-slate-300 select-none">
        <div className="flex items-center gap-2 font-medium">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span className="text-slate-200 uppercase tracking-wider text-xs font-semibold px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
            {cleanLang || 'code'}
          </span>
          <span className="text-slate-500 text-xs font-sans">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Line Numbers Toggle */}
          <button
            type="button"
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            title={showLineNumbers ? 'Hide Line Numbers' : 'Show Line Numbers'}
            className={`p-1.5 rounded-md hover:bg-slate-700/60 transition-colors ${showLineNumbers ? 'text-blue-400' : 'text-slate-400'}`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          {/* Open in Workspace / Preview */}
          {onOpenInWorkspace && (
            <button
              type="button"
              onClick={() => onOpenInWorkspace(code, cleanLang)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 rounded-md transition-colors"
              title="Open code in interactive workspace & live preview"
            >
              {isRunnable ? <Play className="w-3 h-3 fill-current" /> : <ExternalLink className="w-3 h-3" />}
              <span>{isRunnable ? 'Preview / Run' : 'Workspace'}</span>
            </button>
          )}

          {/* Quick Actions Dropdown */}
          {onQuickAction && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
                title="AI Quick Actions"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Actions</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showActionMenu && (
                <div 
                  className="absolute right-0 top-full mt-1.5 w-48 bg-[#1f2937] border border-slate-700 rounded-lg shadow-2xl py-1.5 z-50 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setShowActionMenu(false)}
                >
                  <button
                    type="button"
                    onClick={() => { setShowActionMenu(false); onQuickAction('explain', code, cleanLang); }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-700/60 text-slate-200"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Explain this logic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowActionMenu(false); onQuickAction('test', code, cleanLang); }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-700/60 text-slate-200"
                  >
                    <Check className="w-3.5 h-3.5 text-purple-400" />
                    <span>Generate Unit Tests</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowActionMenu(false); onQuickAction('refactor', code, cleanLang); }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-700/60 text-slate-200"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Refactor & Optimize</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowActionMenu(false); onQuickAction('audit', code, cleanLang); }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-700/60 text-slate-200"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Security & Bug Audit</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Download File */}
          <button
            type="button"
            onClick={handleDownload}
            title="Download snippet file"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy code to clipboard"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
              copied 
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/50' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div className="relative flex overflow-x-auto text-[13px] leading-relaxed p-3.5 bg-[#0d1117]">
        {showLineNumbers && (
          <div className="flex flex-col select-none text-right pr-3.5 text-slate-600 border-r border-slate-800 font-mono text-[13px] leading-relaxed shrink-0">
            {lines.map((_, i) => (
              <span key={i} className="px-1">{i + 1}</span>
            ))}
          </div>
        )}
        <pre className={`flex-1 ${showLineNumbers ? 'pl-3.5' : 'pl-1'} overflow-x-auto text-slate-100 font-mono focus:outline-none`}>
          <code 
            className={`language-${cleanLang}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode || escapeHtml(code) }}
          />
        </pre>
      </div>
    </div>
  );
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
