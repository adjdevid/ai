import React, { useState } from 'react';
import { 
  X, 
  BrainCircuit, 
  Layers, 
  ListTodo, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { ProjectMemory } from '../types';

interface ProjectMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: ProjectMemory;
  onSaveMemory: (updated: ProjectMemory) => void;
}

export function ProjectMemoryModal({
  isOpen,
  onClose,
  memory,
  onSaveMemory,
}: ProjectMemoryModalProps) {
  const [name, setName] = useState(memory.projectName || 'My Project');
  const [description, setDescription] = useState(memory.description || '');
  const [architectureNotes, setArchitectureNotes] = useState(memory.architectureNotes || '');
  const [techStackInput, setTechStackInput] = useState(memory.techStack?.join(', ') || '');
  const [keyDecisions, setKeyDecisions] = useState<string[]>(memory.keyDecisions || []);
  const [newDecision, setNewDecision] = useState('');
  const [todoList, setTodoList] = useState<string[]>(memory.todoList || []);
  const [newTodo, setNewTodo] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: ProjectMemory = {
      projectName: name.trim() || 'Untitled Project',
      description: description.trim(),
      techStack: techStackInput.split(',').map((s) => s.trim()).filter(Boolean),
      architectureNotes: architectureNotes.trim(),
      keyDecisions,
      todoList,
      lastUpdated: Date.now(),
    };
    onSaveMemory(updated);
    onClose();
  };

  const handleAddDecision = () => {
    if (newDecision.trim()) {
      setKeyDecisions([...keyDecisions, newDecision.trim()]);
      setNewDecision('');
    }
  };

  const handleRemoveDecision = (index: number) => {
    setKeyDecisions(keyDecisions.filter((_, i) => i !== index));
  };

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      setTodoList([...todoList, newTodo.trim()]);
      setNewTodo('');
    }
  };

  const handleRemoveTodo = (index: number) => {
    setTodoList(todoList.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-2xl bg-[#141923] border border-blue-900/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0d121c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                Project Memory & Context
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800">
                  Persistent
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Context and architectural rules preserved across all AI coding iterations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Project Name & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-200 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0b0e14] text-slate-100 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-200 mb-1">
                Tech Stack (comma-separated)
              </label>
              <input
                type="text"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                placeholder="React, TypeScript, Tailwind CSS, Vite..."
                className="w-full bg-[#0b0e14] text-slate-100 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-200 mb-1">
              Project Description & Requirements
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the purpose and core requirements of this project..."
              className="w-full bg-[#0b0e14] text-slate-100 p-3 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Architecture Notes & Design Patterns
            </label>
            <textarea
              rows={3}
              value={architectureNotes}
              onChange={(e) => setArchitectureNotes(e.target.value)}
              placeholder="e.g. Single-directional data flow, modular component structure, local storage caching..."
              className="w-full bg-[#0b0e14] text-slate-100 p-3 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-mono text-xs leading-relaxed resize-none"
            />
          </div>

          {/* Key Decisions */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Key Architectural Decisions
            </label>
            <div className="space-y-1.5 mb-2">
              {keyDecisions.map((dec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#0b0e14] border border-slate-800 text-slate-300 font-mono text-[11px]"
                >
                  <span>• {dec}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDecision(i)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDecision}
                onChange={(e) => setNewDecision(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDecision()}
                placeholder="Add decision (e.g. Use Lucide for all icons)..."
                className="flex-1 bg-[#0b0e14] text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddDecision}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Todo List */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-purple-400" />
              Project Roadmap & Todo List
            </label>
            <div className="space-y-1.5 mb-2">
              {todoList.map((todo, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#0b0e14] border border-slate-800 text-slate-300 text-xs"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    {todo}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTodo(i)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                placeholder="Add next feature todo..."
                className="flex-1 bg-[#0b0e14] text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddTodo}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#0d121c] border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last updated {new Date(memory.lastUpdated || Date.now()).toLocaleTimeString()}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs shadow-md transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Project Memory</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
