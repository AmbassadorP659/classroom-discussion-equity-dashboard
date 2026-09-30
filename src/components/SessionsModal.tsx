import React, { useState, useRef } from 'react';
import {
  FolderArchive,
  Play,
  Copy,
  Trash2,
  Download,
  Upload,
  Plus,
  Edit2,
  Check,
  X,
  Clock,
  Users,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { SavedSession, Student, LogEntry, PodConfig, LayoutMode, CardDensity, EquityThresholds } from '../types';

interface SessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSessions: SavedSession[];
  activeSessionId: string | null;
  activeSessionName: string;
  onSaveCurrentSession: (name: string, subjectOrPeriod?: string) => void;
  onResumeSession: (session: SavedSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onDuplicateSession: (session: SavedSession) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onStartNewSession: (options: { keepRoster: boolean; name: string }) => void;
  onImportSession: (session: SavedSession) => void;
  // Current live state for displaying live metrics
  currentStudentsCount: number;
  currentLogsCount: number;
}

export const SessionsModal: React.FC<SessionsModalProps> = ({
  isOpen,
  onClose,
  savedSessions,
  activeSessionId,
  activeSessionName,
  onSaveCurrentSession,
  onResumeSession,
  onDeleteSession,
  onDuplicateSession,
  onRenameSession,
  onStartNewSession,
  onImportSession,
  currentStudentsCount,
  currentLogsCount,
}) => {
  const [saveAsName, setSaveAsName] = useState('');
  const [saveAsSubject, setSaveAsSubject] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [keepRosterForNew, setKeepRosterForNew] = useState(true);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleStartSaveNew = () => {
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    setSaveAsName(`Discussion Seminar - ${today}`);
    setSaveAsSubject('Period 3 • AP English');
    setIsSavingNew(true);
  };

  const handleConfirmSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveAsName.trim()) return;
    onSaveCurrentSession(saveAsName.trim(), saveAsSubject.trim() || undefined);
    setIsSavingNew(false);
    setSaveAsName('');
  };

  const handleStartNewSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    onStartNewSession({
      name: newSessionName.trim(),
      keepRoster: keepRosterForNew,
    });
    setIsCreatingNew(false);
    setNewSessionName('');
  };

  const handleStartRename = (session: SavedSession) => {
    setEditingId(session.id);
    setEditingName(session.name);
  };

  const handleConfirmRename = (sessionId: string) => {
    if (editingName.trim()) {
      onRenameSession(sessionId, editingName.trim());
    }
    setEditingId(null);
  };

  // Export single session as JSON
  const handleExportJSON = (session: SavedSession) => {
    const jsonStr = JSON.stringify(session, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitized = session.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    link.download = `session_${sanitized}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.students) && Array.isArray(parsed.logs)) {
          // Valid session file
          const imported: SavedSession = {
            ...parsed,
            id: `session_${Date.now()}`,
            name: `${parsed.name || 'Imported Session'} (Imported)`,
            updatedAt: new Date().toISOString(),
          };
          onImportSession(imported);
        } else {
          alert('Invalid session JSON format. Must contain students and logs arrays.');
        }
      } catch (err) {
        alert('Failed to parse session file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center">
                <span>Classroom Sessions Manager</span>
              </h2>
              <p className="text-xs text-slate-400">
                Save, resume, duplicate, and export classroom discussions across dates and periods.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Session Banner */}
        <div className="bg-blue-50/70 border-b border-blue-100 px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Active Session
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  Continuous Auto-Save Active
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                {activeSessionName}
              </h3>
              <p className="text-xs text-slate-500">
                {currentStudentsCount} students seated • {currentLogsCount} logged contributions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isSavingNew && (
              <button
                type="button"
                onClick={handleStartSaveNew}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save As Snapshot...
              </button>
            )}

            {!isCreatingNew && (
              <button
                type="button"
                onClick={() => {
                  setNewSessionName(`Period 4 - Discussion (${new Date().toLocaleDateString()})`);
                  setIsCreatingNew(true);
                }}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                New Session...
              </button>
            )}
          </div>
        </div>

        {/* Inline Save As New Form */}
        {isSavingNew && (
          <form
            onSubmit={handleConfirmSaveNew}
            className="bg-indigo-50/80 border-b border-indigo-100 p-4 sm:p-5 animate-in fade-in"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2 flex items-center">
              <Save className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Save Current Workspace As New Session
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-bold text-indigo-950 mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  value={saveAsName}
                  onChange={(e) => setSaveAsName(e.target.value)}
                  placeholder="e.g., Socratic Seminar - Chapter 4"
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-indigo-200 bg-white focus:outline-blue-600 shadow-2xs"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-indigo-950 mb-1">
                  Period / Subject Note
                </label>
                <input
                  type="text"
                  value={saveAsSubject}
                  onChange={(e) => setSaveAsSubject(e.target.value)}
                  placeholder="e.g., Period 3 • AP English"
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-indigo-200 bg-white focus:outline-blue-600 shadow-2xs"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsSavingNew(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!saveAsName.trim()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                Save Snapshot
              </button>
            </div>
          </form>
        )}

        {/* Inline Create New Session Form */}
        {isCreatingNew && (
          <form
            onSubmit={handleStartNewSessionSubmit}
            className="bg-emerald-50/80 border-b border-emerald-100 p-4 sm:p-5 animate-in fade-in"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Start New Discussion Session
            </h4>
            <div className="space-y-3 mb-3">
              <div>
                <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                  New Session Name
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g., Period 1 - Discussion (Oct 14)"
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-emerald-200 bg-white focus:outline-blue-600 shadow-2xs"
                  autoFocus
                />
              </div>
              <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepRosterForNew}
                  onChange={(e) => setKeepRosterForNew(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>
                  Keep current roster and seating layout (clears only logs and discussion metrics)
                </span>
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newSessionName.trim()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                Start New Session
              </button>
            </div>
          </form>
        )}

        {/* Saved Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Saved Sessions Archive ({savedSessions.length})
            </span>

            {/* Import JSON File */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                Import Session File (.json)
              </button>
            </div>
          </div>

          {savedSessions.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FolderArchive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No Saved Sessions Yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Your current session is actively auto-saving. Click &ldquo;Save As Snapshot&rdquo; above to preserve milestone checkpoints.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {savedSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const isEditing = editingId === session.id;
                const isDeleting = deleteConfirmId === session.id;

                const formattedDate = new Date(session.updatedAt || session.createdAt).toLocaleString(
                  'en-US',
                  {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  }
                );

                return (
                  <div
                    key={session.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isActive
                        ? 'border-blue-400 bg-blue-50/40 shadow-xs ring-1 ring-blue-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex-1 min-w-[200px]">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="text-sm font-bold px-2 py-1 border border-blue-400 rounded-md bg-white focus:outline-hidden w-full max-w-xs"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleConfirmRename(session.id)}
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded text-slate-400 hover:bg-slate-100 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-extrabold text-slate-900 truncate">
                              {session.name}
                            </h4>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white font-mono">
                                Active Now
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStartRename(session)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                              title="Rename session"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                          {session.subjectOrPeriod && (
                            <span className="font-semibold text-slate-700">
                              {session.subjectOrPeriod}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-slate-400" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1 text-slate-400" />
                            {session.studentCount || session.students.length} students
                          </span>
                          <span className="flex items-center">
                            <MessageSquare className="w-3 h-3 mr-1 text-slate-400" />
                            {session.logCount ?? session.logs.length} contributions
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1.5">
                        {isDeleting ? (
                          <div className="flex items-center space-x-1.5 bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                            <span className="text-[11px] font-bold text-rose-700">Delete?</span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteSession(session.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-300 cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Resume / Load Button */}
                            {!isActive && (
                              <button
                                type="button"
                                onClick={() => {
                                  onResumeSession(session);
                                  onClose();
                                }}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all cursor-pointer"
                              >
                                <Play className="w-3 h-3 mr-1 fill-white" />
                                Resume
                              </button>
                            )}

                            {/* Duplicate Button */}
                            <button
                              type="button"
                              onClick={() => onDuplicateSession(session)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Duplicate session (e.g. for next period)"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Export JSON Button */}
                            <button
                              type="button"
                              onClick={() => handleExportJSON(session)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Export backup file (.json)"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(session.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete saved session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All discussion sessions are stored locally in your browser and exportable as JSON.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
