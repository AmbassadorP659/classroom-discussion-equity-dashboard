import React, { useState, useEffect } from 'react';
import {
  Users,
  X,
  ArrowDownAZ,
  Shuffle,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { Student } from '../types';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSave: (updatedStudents: Student[]) => void;
  onRestoreDefaults: () => void;
  onClearContributions: () => void;
  onExportBackup: () => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  students: initialStudents,
  onSave,
  onRestoreDefaults,
  onClearContributions,
  onExportBackup,
}) => {
  const [localStudents, setLocalStudents] = useState<Student[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalStudents(JSON.parse(JSON.stringify(initialStudents)));
      setSearchFilter('');
      setErrorMessage(null);
    }
  }, [isOpen, initialStudents]);

  if (!isOpen) return null;

  const reindex = (list: Student[]) => {
    return list.map((item, idx) => ({
      ...item,
      seat: idx + 1,
    }));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...localStudents];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setLocalStudents(reindex(updated));
  };

  const handleMoveDown = (index: number) => {
    if (index === localStudents.length - 1) return;
    const updated = [...localStudents];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setLocalStudents(reindex(updated));
  };

  const handleNameChange = (id: string, name: string) => {
    setLocalStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  };

  const handleDeleteSeat = (id: string) => {
    setLocalStudents((prev) => reindex(prev.filter((s) => s.id !== id)));
  };

  const handleAddSeat = () => {
    const nextSeat = localStudents.length + 1;
    const newStudent: Student = {
      id: 'std_' + Date.now(),
      seat: nextSeat,
      name: `Student ${nextSeat}`,
    };
    setLocalStudents([...localStudents, newStudent]);
  };

  const handleSortAlpha = () => {
    const sorted = [...localStudents].sort((a, b) => a.name.localeCompare(b.name));
    setLocalStudents(reindex(sorted));
  };

  const handleShuffle = () => {
    const shuffled = [...localStudents];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setLocalStudents(reindex(shuffled));
  };

  const handleSaveAndClose = () => {
    if (localStudents.length === 0) {
      setErrorMessage('Please add at least 1 student to the roster.');
      return;
    }
    setErrorMessage(null);
    onSave(localStudents);
    onClose();
  };

  const filteredStudents = localStudents.filter((s) =>
    s.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-blue-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Edit Roster &amp; Seating (In-Tool)</h3>
              <p className="text-xs text-blue-200">
                Full in-cell editing, reordering, layout presets, and bulk actions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSortAlpha}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-md font-semibold text-slate-700 shadow-xs flex items-center cursor-pointer"
            >
              <ArrowDownAZ className="w-3.5 h-3.5 mr-1 text-blue-600" />
              Sort A-Z
            </button>
            <button
              onClick={handleShuffle}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-md font-semibold text-slate-700 shadow-xs flex items-center cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 mr-1 text-purple-600" />
              Shuffle Seats
            </button>
            <button
              onClick={onExportBackup}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-md font-semibold text-slate-700 shadow-xs flex items-center cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Backup
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Quick find student..."
                className="pl-7 pr-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <span className="text-xs font-bold text-slate-600 font-mono tabular-nums">
              {localStudents.length} Seats
            </span>
          </div>
        </div>

        {/* Roster Interactive List Body */}
        <div className="p-5 max-h-[55vh] overflow-y-auto custom-scrollbar">
          {errorMessage && (
            <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 ml-2"
              >
                ✕
              </button>
            </div>
          )}
          <div className="space-y-2">
            {filteredStudents.map((std, i) => {
              const originalIndex = localStudents.findIndex((s) => s.id === std.id);
              return (
                <div
                  key={std.id}
                  className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100/70 p-2.5 rounded-xl border border-slate-200 transition-all"
                >
                  {/* Reorder Buttons */}
                  <div className="flex items-center space-x-1 text-slate-400 pl-1">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(originalIndex)}
                      disabled={originalIndex === 0}
                      className="p-1 hover:text-blue-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title="Move seat up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(originalIndex)}
                      disabled={originalIndex === localStudents.length - 1}
                      className="p-1 hover:text-blue-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title="Move seat down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="w-16 font-mono text-xs font-bold text-slate-600">
                    Seat #{std.seat}
                  </span>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={std.name}
                      onChange={(e) => handleNameChange(std.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSeat();
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSeat(std.id)}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer"
                    title="Remove seat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Seat Row */}
          <button
            type="button"
            onClick={handleAddSeat}
            className="mt-3 w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl text-xs font-bold text-blue-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 mr-2 text-blue-600" />
            Add New Student / Seat Row (Enter)
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onRestoreDefaults();
                onClose();
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Restore 12 Defaults
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={onClearContributions}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
            >
              Clear Contributions Only
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndClose}
              className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              Save &amp; Update Classroom
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
