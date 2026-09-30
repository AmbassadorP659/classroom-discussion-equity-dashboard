import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  Crown,
  Bell,
  Download,
  Lightbulb,
  HelpCircle,
  Link as LinkIcon,
  Plus,
  Table as TableIcon,
  TrendingUp,
} from 'lucide-react';
import { Student, StudentMetrics, EquityTier, EquityThresholds } from '../types';

interface EquityTableProps {
  students: Student[];
  metrics: Record<string, StudentMetrics>;
  totalLogsCount: number;
  thresholds: EquityThresholds;
  getEquityTier: (metricValue: number) => EquityTier;
  onSelectStudent: (student: Student) => void;
  onExportCSV: () => void;
}

export const EquityTable: React.FC<EquityTableProps> = ({
  students,
  metrics,
  totalLogsCount,
  thresholds,
  getEquityTier,
  onSelectStudent,
  onExportCSV,
}) => {
  const [filterText, setFilterText] = useState('');

  // Calculate summary KPIs
  let activeStudentsCount = 0;
  let lowVoiceAlertsCount = 0;
  let mostActiveStudent = { name: 'None yet', count: 0 };

  students.forEach((student) => {
    const data = metrics[student.id] || { insights: 0, questions: 0, builtOn: 0, total: 0 };
    if (data.total > 0) activeStudentsCount++;
    const evalValue = thresholds.basis === 'total' ? data.total : data.insights;
    if (evalValue <= thresholds.lowMax) lowVoiceAlertsCount++;
    if (data.total > mostActiveStudent.count) {
      mostActiveStudent = { name: student.name, count: data.total };
    }
  });

  const activePercent =
    students.length > 0 ? Math.round((activeStudentsCount / students.length) * 100) : 0;

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(filterText.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Contributions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Contributions
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {totalLogsCount}
            </p>
            <span className="inline-flex items-center text-[11px] text-blue-600 font-semibold mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Live Session Volume
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Active Students */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Students Count
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {activeStudentsCount} / {students.length}
            </p>
            <span className="inline-flex items-center text-[11px] text-emerald-600 font-semibold mt-1">
              <Users className="w-3 h-3 mr-1" />
              {activePercent}% Class Engaged
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Most Active Voice */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Most Active Voice
            </p>
            <p
              className="text-xl font-bold text-slate-900 mt-1 truncate max-w-[150px]"
              title={mostActiveStudent.name}
            >
              {mostActiveStudent.name}
            </p>
            <span className="inline-flex items-center text-[11px] text-purple-600 font-semibold mt-1">
              {mostActiveStudent.count} contributions
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
            <Crown className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Low Voice Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Low Voice Alerts
            </p>
            <p className="text-3xl font-extrabold text-rose-600 mt-1 tabular-nums">
              {lowVoiceAlertsCount}
            </p>
            <span className="inline-flex items-center text-[11px] text-rose-500 font-semibold mt-1">
              <Bell className="w-3 h-3 mr-1" />
              ≤ {thresholds.lowMax} {thresholds.basis === 'total' ? 'Total Events' : 'Insights'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl">
            <Bell className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <TableIcon className="w-4 h-4 text-blue-600 mr-2" />
              Roster Equity Summary Table
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Student voice distribution and participation breakdown
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter student..."
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              onClick={onExportCSV}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 shadow-sm transition-all flex items-center cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Export Table
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Seat</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4 text-center">Total Contributions</th>
                <th className="py-3 px-4 text-center text-blue-700">
                  <span className="flex items-center justify-center">
                    <Lightbulb className="w-3 h-3 mr-1 text-blue-500" />
                    New Insights
                  </span>
                </th>
                <th className="py-3 px-4 text-center text-amber-700">
                  <span className="flex items-center justify-center">
                    <HelpCircle className="w-3 h-3 mr-1 text-amber-500" />
                    Questions Posed
                  </span>
                </th>
                <th className="py-3 px-4 text-center text-emerald-700">
                  <span className="flex items-center justify-center">
                    <LinkIcon className="w-3 h-3 mr-1 text-emerald-500" />
                    Built on Peer
                  </span>
                </th>
                <th className="py-3 px-4 text-center">Equity Status</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((std) => {
                const d = metrics[std.id] || {
                  student: std,
                  insights: 0,
                  questions: 0,
                  builtOn: 0,
                  total: 0,
                };
                const evalVal = thresholds.basis === 'total' ? d.total : d.insights;
                const tier = getEquityTier(evalVal);

                const initials = std.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2);

                return (
                  <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500 text-xs">
                      #{std.seat}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                      <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center justify-center font-bold shrink-0">
                        {initials}
                      </span>
                      <span className="truncate">{std.name}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-slate-900 bg-slate-50/40 text-sm tabular-nums">
                      {d.total}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-blue-700 bg-blue-50/20 tabular-nums">
                      {d.insights}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-700 bg-amber-50/20 tabular-nums">
                      {d.questions}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 tabular-nums">
                      {d.builtOn}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${tier.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${tier.dotClass}`}></span>
                        <span>{tier.tier}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectStudent(std)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer inline-flex items-center"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Tap
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
