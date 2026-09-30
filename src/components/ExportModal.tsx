import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  ShieldAlert,
  ExternalLink,
  ClipboardPaste,
  CheckCircle2,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyCSV: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onCopyCSV,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    onCopyCSV();
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">Export to Google Sheets</h3>
              <p className="text-xs text-emerald-200">Direct integration &amp; clipboard pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Security Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <strong className="font-bold">Client-Side Security Notice:</strong>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Browser security protocols safeguard your student data by preventing silent direct
                uploads to private Google Drive accounts. Use these 2 seamless, verified methods:
              </p>
            </div>
          </div>

          {/* Method 1 */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white shadow-sm space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] mr-1.5 font-bold">
                  1
                </span>
                Launch Google Sheets
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-mono">
                sheets.new
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Opens a fresh, blank Google Sheet spreadsheet in a new tab immediately.
            </p>
            <a
              href="https://sheets.new"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Blank Sheet (sheets.new)
            </a>
          </div>

          {/* Method 2 */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white shadow-sm space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] mr-1.5 font-bold">
                  2
                </span>
                Copy CSV Data to Clipboard
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono">
                Ready to paste
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Packages Live Tracker entries &amp; equity summaries into CSV format. Simply paste into{' '}
              <strong>Cell A1</strong> of your Google Sheet.
            </p>
            <button
              onClick={handleCopy}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center cursor-pointer"
            >
              <ClipboardPaste className="w-4 h-4 mr-2" />
              Copy CSV to Clipboard
            </button>
          </div>

          {/* Toast notification feedback */}
          {copied && (
            <div className="p-3 bg-emerald-900 text-emerald-100 rounded-lg text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
                Data copied! Press <strong>Ctrl+V / Cmd+V</strong> in Google Sheets.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
