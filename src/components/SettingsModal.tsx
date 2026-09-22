import React from 'react';
import { X, Settings, Sliders, Cpu, Trash2, Shield, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  temperature: number;
  onChangeTemperature: (val: number) => void;
  onClearAllData: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  temperature,
  onChangeTemperature,
  onClearAllData,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-md bg-[#161b22] border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-sm text-slate-100">CodeAI Studio Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs text-slate-300">
          {/* AI Model info */}
          <div className="p-3 bg-[#0d1117] border border-slate-800 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5 text-slate-200">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Underlying AI Model
              </span>
              <span className="font-mono text-emerald-400 text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Low-latency server-side reasoning optimized for coding, refactoring, and real-time generation.
            </p>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                Temperature (Creativity vs Determinism)
              </label>
              <span className="font-mono text-blue-400 font-semibold">{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => onChangeTemperature(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.0 (Precise / Deterministic)</span>
              <span>0.7 (Standard)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>

          {/* Clean Data Action */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-200">Local Session Storage</div>
              <div className="text-[11px] text-slate-500">Clear cached threads and reset to default</div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to delete all saved sessions? This cannot be undone.')) {
                  onClearAllData();
                  onClose();
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#0d1117] border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs shadow transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
