import React from 'react';
import {
  ListChecks,
  Trash2,
  Copy,
  Clock,
  Lightbulb,
  HelpCircle,
  Link as LinkIcon,
  ClipboardList,
} from 'lucide-react';
import { LogEntry } from '../types';

interface LiveTrackerLogProps {
  logs: LogEntry[];
  onDeleteLog: (id: string) => void;
  onClearLog: () => void;
  onCopyRawLog: () => void;
}

export const LiveTrackerLog: React.FC<LiveTrackerLogProps> = ({
  logs,
  onDeleteLog,
  onClearLog,
  onCopyRawLog,
}) => {
  const sortedLogs = [...logs].reverse();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <ListChecks className="w-4 h-4 text-emerald-600 mr-2" />
              Live Tracker Chronological Audit Log
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 font-mono tabular-nums">
              {logs.length} transactions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mirroring openpyxl's 'Live Tracker' raw transaction schema with timestamps
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onClearLog}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-all flex items-center cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear Log
          </button>
          <button
            onClick={onCopyRawLog}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-all flex items-center cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Copy Raw Sheet Data
          </button>
        </div>
      </div>

      {/* Log Entries Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <th className="py-3 px-4 font-mono">Index</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-4">Contribution Type</th>
              <th className="py-3 px-4">Interaction Target</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedLogs.map((entry, idx) => {
              const displayIndex = logs.length - idx;

              let typeBadge = null;
              if (entry.type === 'New Insight') {
                typeBadge = (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    <Lightbulb className="w-3 h-3 mr-1 text-blue-500" />
                    New Insight
                  </span>
                );
              } else if (entry.type === 'Question Posed') {
                typeBadge = (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <HelpCircle className="w-3 h-3 mr-1 text-amber-500" />
                    Question Posed
                  </span>
                );
              } else {
                typeBadge = (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <LinkIcon className="w-3 h-3 mr-1 text-emerald-500" />
                    Built on Peer
                  </span>
                );
              }

              return (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-400 tabular-nums">
                    #{displayIndex}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                    <span className="inline-flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-slate-400" />
                      {entry.timestamp}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{entry.studentName}</td>
                  <td className="py-2.5 px-4">{typeBadge}</td>
                  <td className="py-2.5 px-4 text-xs font-medium text-slate-700">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {entry.target}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => onDeleteLog(entry.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {logs.length === 0 && (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-xl mb-3">
            <ClipboardList className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No classroom interactions logged yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Switch to the Seating Chart tab and tap any student card to record their first insight, question, or peer build.
          </p>
        </div>
      )}
    </div>
  );
};
