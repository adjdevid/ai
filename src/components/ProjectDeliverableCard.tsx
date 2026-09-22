import React, { useState } from 'react';
import { 
  FolderArchive, 
  Download, 
  FileCode2, 
  Check, 
  FolderTree, 
  Eye, 
  Code2,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { ProjectFile, ProjectDeliverable } from '../types';
import { downloadProjectZip, downloadSingleFile, formatBytes } from '../utils/zipUtils';

interface ProjectDeliverableCardProps {
  deliverable?: ProjectDeliverable;
  deliveredFiles?: Array<{ path: string; language?: string; action?: 'create' | 'edit' | 'delete' }>;
  projectFiles: ProjectFile[];
  projectName?: string;
  onOpenFileInWorkspace: (file: ProjectFile) => void;
  onOpenPreview: () => void;
}

export function ProjectDeliverableCard({
  deliverable,
  deliveredFiles = [],
  projectFiles = [],
  projectName = 'codeai-project',
  onOpenFileInWorkspace,
  onOpenPreview,
}: ProjectDeliverableCardProps) {
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);

  // Identify files touched in this specific deliverable / step
  const touchedPaths = new Set<string>();
  if (deliveredFiles && deliveredFiles.length > 0) {
    deliveredFiles.forEach(f => touchedPaths.add(f.path));
  }
  if (deliverable?.filesCreated) {
    deliverable.filesCreated.forEach(p => touchedPaths.add(p));
  }
  if (deliverable?.filesUpdated) {
    deliverable.filesUpdated.forEach(p => touchedPaths.add(p));
  }

  // Filter project files to specifically display delivered ones
  const filesToShow = touchedPaths.size > 0
    ? projectFiles.filter(f => touchedPaths.has(f.path))
    : projectFiles;

  if (filesToShow.length === 0 && projectFiles.length === 0) {
    return null;
  }

  const effectiveFiles = filesToShow.length > 0 ? filesToShow : projectFiles;
  const totalProjectBytes = projectFiles.reduce((sum, f) => sum + (f.size || 0), 0);

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      await downloadProjectZip(projectFiles, projectName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('ZIP download error:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="my-3.5 rounded-xl border border-slate-800 bg-[#0c121e]/95 p-3.5 sm:p-4 shadow-xl select-none backdrop-blur-sm">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 shrink-0">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-xs sm:text-sm text-slate-100">
                Berkas Selesai Diproses
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/50 font-mono font-medium">
                {effectiveFiles.length} berkas siap
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tersedia untuk pengeditan, pratinjau langsung, dan ekspor paket ZIP.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pratinjau Live</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Unduhan Berhasil!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>{isZipping ? 'Mengompres...' : 'Unduh ZIP'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Delivered Files List */}
      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {effectiveFiles.map((file) => {
            const fileDeliveredInfo = deliveredFiles.find(d => d.path === file.path);
            const isCreated = fileDeliveredInfo?.action !== 'edit';

            return (
              <div
                key={file.id || file.path}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#111827]/80 hover:bg-[#162033] border border-slate-800 hover:border-blue-700/50 transition-all group"
              >
                <div
                  onClick={() => onOpenFileInWorkspace(file)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer mr-2"
                >
                  <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-slate-200 group-hover:text-blue-300 truncate font-medium">
                      {file.path}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span className={`px-1.5 py-0.2 rounded font-semibold ${
                        isCreated
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                          : 'bg-blue-950/80 text-blue-300 border border-blue-800/40'
                      }`}>
                        {isCreated ? 'Dibuat' : 'Diperbarui'}
                      </span>
                      <span>{formatBytes(file.size || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenFileInWorkspace(file)}
                    title="Buka di Editor Workspace"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-md transition-colors"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSingleFile(file)}
                    title="Unduh berkas tunggal"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Optional Toggle for All Project Files */}
        {projectFiles.length > effectiveFiles.length && (
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowAllFiles(!showAllFiles)}
              className="text-slate-400 hover:text-blue-400 flex items-center gap-1.5 transition-colors font-medium text-[11px]"
            >
              <FolderTree className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {showAllFiles ? 'Sembunyikan berkas lainnya' : `Lihat seluruh berkas proyek (${projectFiles.length} berkas)`}
              </span>
              {showAllFiles ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <span className="text-[11px] text-slate-500 font-mono">
              Total: {formatBytes(totalProjectBytes)}
            </span>
          </div>
        )}

        {/* Expanded All Project Files Grid */}
        {showAllFiles && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 animate-in fade-in duration-150">
            {projectFiles
              .filter(f => !effectiveFiles.some(ef => ef.path === f.path))
              .map((file) => (
                <div
                  key={file.id || file.path}
                  onClick={() => onOpenFileInWorkspace(file)}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#0b0f19] hover:bg-[#111827] border border-slate-800/70 text-slate-300 font-mono text-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                    {formatBytes(file.size || 0)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
