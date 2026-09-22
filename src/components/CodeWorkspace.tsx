import React, { useState, useEffect, useRef } from 'react';
import { 
  Code2, 
  Play, 
  Eye, 
  SplitSquareVertical, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Terminal, 
  Sparkles, 
  FileCode, 
  X, 
  Maximize2, 
  Minimize2,
  AlertTriangle,
  Zap,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CodeArtifact, AnalysisResult } from '../types';
import { getFileExtension } from '../utils/codeParser';
import Prism from 'prismjs';

interface CodeWorkspaceProps {
  artifact: CodeArtifact | null;
  onClose: () => void;
  onSendPromptToChat: (prompt: string) => void;
}

export function CodeWorkspace({
  artifact,
  onClose,
  onSendPromptToChat,
}: CodeWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'diff' | 'analysis' | 'tests' | 'console'>('preview');
  const [currentCode, setCurrentCode] = useState(artifact?.code || '');
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: 'log' | 'error' | 'warn' | 'info'; message: string; timestamp: string }>>([]);
  
  // Deep Analysis state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Unit Test state
  const [generatedTests, setGeneratedTests] = useState<string | null>(null);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);

  // Refactoring state
  const [isRefactoring, setIsRefactoring] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (artifact) {
      setCurrentCode(artifact.code);
      setConsoleLogs([]);
      setAnalysisResult(null);
      setGeneratedTests(null);
      
      // Auto-switch to preview if it's HTML/runnable
      const isHtml = artifact.language === 'html' || 
        artifact.code.includes('<!DOCTYPE html>') || 
        artifact.code.includes('<html>');
      
      if (isHtml) {
        setActiveTab('preview');
      } else {
        setActiveTab('editor');
      }
    }
  }, [artifact]);

  if (!artifact) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#0e1117] text-slate-400 border-l border-slate-800">
        <Code2 className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Active Code Artifact</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Click "Preview / Run" or "Workspace" on any code block in the chat to edit, execute live web previews, run Big-O complexity analysis, and generate unit tests.
        </p>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = () => {
    const ext = getFileExtension(artifact.language);
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '-').toLowerCase()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Run in-depth AI code audit / complexity
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/code/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentCode,
          language: artifact.language || 'typescript',
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

  // Generate Unit Tests
  const handleGenerateTests = async () => {
    setIsGeneratingTests(true);
    try {
      const res = await fetch('/api/code/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentCode,
          language: artifact.language || 'typescript',
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

  // Generate HTML preview content with error interceptor & console capture
  const getPreviewHtml = () => {
    let htmlContent = currentCode;

    // If it's pure JS or TS without HTML structure, wrap it into a runnable HTML sandbox
    if (artifact.language === 'javascript' || artifact.language === 'js') {
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 p-6 font-sans">
  <h2 class="text-lg font-bold mb-4">JavaScript Sandbox Execution</h2>
  <div id="output" class="font-mono bg-slate-950 p-4 rounded-lg border border-slate-800 text-emerald-400 min-h-[120px]"></div>
  <script>
    const out = document.getElementById('output');
    const oldLog = console.log;
    console.log = (...args) => {
      oldLog(...args);
      out.innerText += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ') + '\\n';
    };
    try {
      ${currentCode}
    } catch(e) {
      console.error(e);
      out.innerHTML += '<span class="text-rose-400">Error: ' + e.message + '</span>\\n';
    }
  </script>
</body>
</html>`;
    } else if (!htmlContent.includes('<!DOCTYPE') && !htmlContent.includes('<html')) {
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 p-4 font-sans antialiased">
  ${htmlContent}
</body>
</html>`;
    }

    // Inject console capture script
    const injectedScript = `
      <script>
        (function() {
          function sendLog(type, args) {
            window.parent.postMessage({
              type: 'CODEAI_CONSOLE_LOG',
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

    return htmlContent.replace('<head>', `<head>${injectedScript}`);
  };

  // Listen for console logs from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CODEAI_CONSOLE_LOG') {
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
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const isHtmlCapable = artifact.language === 'html' || 
    artifact.language === 'javascript' || 
    artifact.language === 'js' || 
    currentCode.includes('<!DOCTYPE html>') || 
    currentCode.includes('<html>');

  return (
    <div className={`flex flex-col h-full bg-[#0d1117] border-l border-slate-800 ${isFullScreen ? 'fixed inset-0 z-50' : 'relative'}`}>
      {/* Top Workspace Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-slate-800 text-xs text-slate-300 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="font-semibold text-slate-200 truncate max-w-[160px] sm:max-w-[220px]">
            {artifact.title}
          </span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {artifact.language}
          </span>
        </div>

        {/* Right workspace tools */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            title="Download file"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close workspace"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1217] border-b border-slate-800/80 overflow-x-auto text-xs">
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
            <span>Code Editor</span>
          </button>

          {isHtmlCapable && (
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
              <span>Live Preview</span>
            </button>
          )}

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

        {/* Quick Refactor / AI Action in Tab Bar */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSendPromptToChat(`Please optimize and refactor this ${artifact.language} code:\n\`\`\`${artifact.language}\n${currentCode}\n\`\`\``)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-300 bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/50 rounded-md transition-colors"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Ask AI to Refactor</span>
          </button>
        </div>
      </div>

      {/* Main Tab View Content */}
      <div className="flex-1 overflow-hidden relative bg-[#090d13]">
        {/* Editor Tab */}
        {activeTab === 'editor' && (
          <div className="h-full flex flex-col">
            <textarea
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              className="flex-1 w-full bg-[#0d1117] text-slate-100 p-4 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none resize-none selection:bg-blue-600/30 border-none"
              spellCheck={false}
            />
            <div className="px-4 py-2 bg-[#161b22] border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between select-none">
              <span className="font-mono">
                {currentCode.split('\n').length} lines • {currentCode.length} characters
              </span>
              <button
                type="button"
                onClick={() => {
                  if (isHtmlCapable) setActiveTab('preview');
                  else handleRunAnalysis();
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium text-xs shadow transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isHtmlCapable ? 'Run Live Preview' : 'Analyze Code'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Preview Tab */}
        {activeTab === 'preview' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 bg-white relative">
              <iframe
                ref={iframeRef}
                title="CodeAI Sandbox Preview"
                srcDoc={getPreviewHtml()}
                sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
                className="w-full h-full border-0"
              />
            </div>
            <div className="px-3 py-2 bg-[#161b22] border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between select-none">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sandbox Container Active
              </span>
              <button
                type="button"
                onClick={() => {
                  if (iframeRef.current) {
                    iframeRef.current.srcdoc = getPreviewHtml();
                  }
                }}
                className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reload</span>
              </button>
            </div>
          </div>
        )}

        {/* Big-O & Audit Tab */}
        {activeTab === 'analysis' && (
          <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4">
            {!analysisResult && !isAnalyzing && (
              <div className="text-center py-10">
                <Zap className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-slate-200">Deep Code & Complexity Audit</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Evaluate algorithmic Time & Space complexity (Big-O), security score, maintainability rating, and potential bugs.
                </p>
                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-xs rounded-lg shadow-lg shadow-amber-600/20 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Complete Code Audit</span>
                </button>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-300 font-mono">Analyzing algorithmic structure & security vectors...</p>
              </div>
            )}

            {analysisError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs">
                {analysisError}
              </div>
            )}

            {analysisResult && (
              <div className="space-y-4">
                {/* Score Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#161b22] border border-slate-800 rounded-xl">
                    <span className="text-[11px] text-slate-400 font-medium">Time Complexity</span>
                    <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                      {analysisResult.timeComplexity}
                    </div>
                  </div>
                  <div className="p-3 bg-[#161b22] border border-slate-800 rounded-xl">
                    <span className="text-[11px] text-slate-400 font-medium">Space Complexity</span>
                    <div className="text-base font-bold text-blue-400 font-mono mt-0.5">
                      {analysisResult.spaceComplexity}
                    </div>
                  </div>
                  <div className="p-3 bg-[#161b22] border border-slate-800 rounded-xl">
                    <span className="text-[11px] text-slate-400 font-medium">Security Score</span>
                    <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                      {analysisResult.securityScore} / 100
                    </div>
                  </div>
                  <div className="p-3 bg-[#161b22] border border-slate-800 rounded-xl">
                    <span className="text-[11px] text-slate-400 font-medium">Maintainability</span>
                    <div className="text-base font-bold text-indigo-400 font-mono mt-0.5">
                      {analysisResult.maintainabilityScore} / 100
                    </div>
                  </div>
                </div>

                {/* Bug Risks */}
                {analysisResult.potentialBugs.length > 0 && (
                  <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-xl">
                    <h5 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Potential Hazards & Edge Cases
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {analysisResult.potentialBugs.map((bug, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{bug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                <div className="p-4 bg-[#161b22] border border-slate-800 rounded-xl">
                  <h5 className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 mb-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    Optimization Recommendations
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {analysisResult.suggestions.map((sug, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">•</span>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Best Practices */}
                <div className="p-4 bg-[#161b22] border border-slate-800 rounded-xl">
                  <h5 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Best Practices & Idiomatic Patterns
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {analysisResult.bestPractices.map((bp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{bp}</span>
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
                <h4 className="text-base font-semibold text-slate-200">Automated Unit Test Suite</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Generate comprehensive test cases covering happy path, null/empty checks, boundary values, and mock assertions.
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
                <div className="px-4 py-2 bg-[#161b22] border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 select-none">
                  <span className="font-mono text-purple-300 font-medium">test.spec.{getFileExtension(artifact.language)}</span>
                  <button
                    type="button"
                    onClick={() => onSendPromptToChat(`Let's execute and verify these unit tests:\n\`\`\`${artifact.language}\n${generatedTests}\n\`\`\``)}
                    className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <span>Send to Chat</span>
                    <ArrowRight className="w-3 h-3" />
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
          <div className="h-full flex flex-col bg-[#0b0e14]">
            <div className="px-4 py-2 bg-[#161b22] border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 select-none">
              <span className="font-mono">Output Stream ({consoleLogs.length} logs)</span>
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
  );
}
