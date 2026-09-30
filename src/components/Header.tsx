import React, { useState, useRef, useEffect } from 'react';
import {
  Presentation,
  Link as LinkIcon,
  FileSpreadsheet,
  UserCheck,
  RotateCw,
  FolderArchive,
  Pencil,
  Check,
  X,
  Sliders,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  syncSourceText: string;
  activeSessionName: string;
  onOpenSpreadsheetHub: () => void;
  onOpenRosterModal?: () => void;
  onOpenExportModal: () => void;
  onOpenSessionsModal: () => void;
  onResetSession: () => void;
  onRenameActiveSession: (newName: string) => void;
  onResyncSource?: () => void;
  isResyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  syncSourceText,
  activeSessionName,
  onOpenSpreadsheetHub,
  onOpenRosterModal,
  onOpenExportModal,
  onOpenSessionsModal,
  onResetSession,
  onRenameActiveSession,
  onResyncSource,
  isResyncing,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(activeSessionName || '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftName(activeSessionName || '');
  }, [activeSessionName]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // Handle outside click & escape key to close dropdown menu
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleSaveRename = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== activeSessionName) {
      onRenameActiveSession(trimmed);
    } else if (!trimmed) {
      setDraftName(activeSessionName || '');
    }
    setIsEditing(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setDraftName(activeSessionName || '');
      setIsEditing(false);
    }
  };

  return (
    <header className="bg-[#1E3A8A] text-white shadow-lg sticky top-0 z-40 border-b border-blue-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left Brand & Session Info */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/60 border border-blue-400/30 flex items-center justify-center text-white shadow-inner flex-shrink-0">
            <Presentation className="w-5 h-5 text-blue-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
                Classroom Equity &amp; Seating Dashboard
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                Live Session
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5 text-xs text-blue-200/80">
              {/* Session Name with Inline Edit & Prompt */}
              {isEditing ? (
                <div className="flex items-center space-x-1.5 bg-blue-950/90 px-2 py-0.5 rounded-lg border border-blue-400/80 shadow-inner">
                  <input
                    ref={inputRef}
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    placeholder="Enter session name..."
                    className="bg-blue-900/90 text-white text-xs px-2 py-0.5 rounded border border-blue-400 focus:outline-none focus:ring-1 focus:ring-amber-300 font-bold min-w-[210px]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveRename}
                    className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                    title="Save name (Enter)"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftName(activeSessionName || '');
                      setIsEditing(false);
                    }}
                    className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors cursor-pointer"
                    title="Cancel (Esc)"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : activeSessionName && activeSessionName.trim() !== '' ? (
                <div className="flex items-center space-x-1 group">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="hover:text-white transition-colors cursor-pointer flex items-center space-x-1 text-left"
                    title="Click to rename session"
                  >
                    <FolderArchive className="w-3 h-3 text-blue-300 inline shrink-0" />
                    <span className="font-semibold text-white/95 underline decoration-dotted decoration-blue-300 hover:decoration-white">
                      {activeSessionName}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-0.5 rounded text-blue-300 hover:text-white hover:bg-blue-800/60 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                    title="Rename session"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40 hover:bg-amber-400/30 transition-all font-bold cursor-pointer"
                  title="Click to name this session"
                >
                  <Pencil className="w-3 h-3 text-amber-300" />
                  <span>Click to name this session...</span>
                </button>
              )}

              <span className="text-blue-300/40">•</span>
              {/* Live Data Source Sync Pill */}
              <div className="inline-flex items-center space-x-1.5">
                <button
                  onClick={onOpenSpreadsheetHub}
                  className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-blue-950/60 hover:bg-blue-900/80 text-emerald-300 border border-emerald-500/30 font-mono text-[11px] transition-all cursor-pointer"
                  title="Click to manage sync source"
                >
                  <LinkIcon className="w-3 h-3 text-emerald-400" />
                  <span>{syncSourceText}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </button>
                {onResyncSource && (
                  <button
                    type="button"
                    onClick={onResyncSource}
                    disabled={isResyncing}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                    title="Re-sync roster from Google Sheet"
                  >
                    <RotateCw className={`w-3 h-3 ${isResyncing ? 'animate-spin' : ''}`} />
                    <span>Re-sync</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Header: Consolidated "Session & Data" Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/25 shadow-xs backdrop-blur-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <Sliders className="w-4 h-4 text-blue-200" />
            <span>Session &amp; Data</span>
            <ChevronDown
              className={`w-4 h-4 text-blue-200 transition-transform duration-200 ${
                isMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu Popup */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Session &amp; Data Tools
              </div>

              {/* Saved Sessions */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenSessionsModal();
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <span className="flex items-center space-x-2.5">
                  <FolderArchive className="w-4 h-4 text-blue-600" />
                  <span>Saved Sessions</span>
                </span>
                <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                  Archive
                </span>
              </button>

              {/* Roster & Data Sources */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenSpreadsheetHub();
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <span className="flex items-center space-x-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>Roster &amp; Data Sources</span>
                </span>
                <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                  Hub
                </span>
              </button>

              {/* Open in Google Sheets */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenExportModal();
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center space-x-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Open in Google Sheets</span>
              </button>

              {/* Optional Re-sync Action in Menu */}
              {onResyncSource && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onResyncSource();
                  }}
                  disabled={isResyncing}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
                >
                  <span className="flex items-center space-x-2.5">
                    <RotateCw className={`w-4 h-4 text-emerald-600 ${isResyncing ? 'animate-spin' : ''}`} />
                    <span>Re-sync Google Sheet</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                    Live
                  </span>
                </button>
              )}

              <div className="my-1.5 border-t border-slate-100"></div>

              {/* Reset Logs */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onResetSession();
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50 flex items-center space-x-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4 text-rose-500" />
                <span>Reset Current Session Logs</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
