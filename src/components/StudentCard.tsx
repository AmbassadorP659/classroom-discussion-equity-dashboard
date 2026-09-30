import React from 'react';
import { GripVertical, ChevronRight, Lightbulb, HelpCircle, Link as LinkIcon } from 'lucide-react';
import { Student, StudentMetrics, EquityTier, CardDensity } from '../types';

interface StudentCardProps {
  student: Student;
  metrics: StudentMetrics;
  tier: EquityTier;
  density?: CardDensity;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onSelect: () => void;
  orientationHint?: string;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  metrics,
  tier,
  density = 'spacious',
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelect,
  orientationHint,
}) => {
  const isCompact = density === 'compact';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onSelect}
      className={`group relative bg-white rounded-xl border-2 shadow-xs hover:shadow-md cursor-pointer transition-all duration-150 flex flex-col justify-between select-none ${
        tier.borderClass
      } ${
        isDragging
          ? 'opacity-25 scale-95 border-dashed border-blue-400'
          : isDragOver
          ? 'ring-4 ring-blue-500 ring-offset-2 scale-102 border-blue-600 bg-blue-50/60 z-20'
          : 'hover:-translate-y-0.5 active:scale-[0.99]'
      } ${isCompact ? 'p-2.5 sm:p-3' : 'p-4 sm:p-5'}`}
    >
      <div>
        {/* Card Header: Seat #, Grip, Equity Badge */}
        <div className={`flex items-center justify-between ${isCompact ? 'mb-1.5' : 'mb-2.5'}`}>
          <div className="flex items-center space-x-1">
            <span
              className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
              title="Drag to insert at a new seat"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            </span>
            <span
              className={`inline-flex items-center font-bold font-mono rounded bg-slate-100 text-slate-700 border border-slate-200 ${
                isCompact ? 'px-1.5 py-0.2 text-[10px]' : 'px-2 py-0.5 text-[11px]'
              }`}
            >
              #{student.seat}
            </span>
            {orientationHint && (
              <span className="hidden sm:inline-block text-[9px] text-slate-400 uppercase font-mono">
                {orientationHint}
              </span>
            )}
          </div>

          <span
            className={`inline-flex items-center space-x-1 rounded-full font-semibold border ${
              tier.badgeClass
            } ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'}`}
          >
            <span className={`rounded-full ${tier.dotClass} ${isCompact ? 'w-1 h-1' : 'w-1.5 h-1.5'}`}></span>
            <span className="truncate max-w-[85px]">{tier.tier}</span>
          </span>
        </div>

        {/* Student Name */}
        <div className={isCompact ? 'mb-2' : 'mb-3.5'}>
          <h3
            className={`font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors tracking-tight truncate ${
              isCompact ? 'text-xs sm:text-sm' : 'text-base sm:text-lg'
            }`}
            title={student.name}
          >
            {student.name}
          </h3>
          {!isCompact && (
            <p className="text-[11px] text-slate-400 font-medium">Click to record voice</p>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div>
        {isCompact ? (
          <div className="flex items-center justify-between py-1 px-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] font-mono">
            <span className="text-blue-700 font-bold" title="Insights">
              I: <strong>{metrics.insights}</strong>
            </span>
            <span className="text-amber-700 font-bold" title="Questions">
              Q: <strong>{metrics.questions}</strong>
            </span>
            <span className="text-emerald-700 font-bold" title="Built On">
              B: <strong>{metrics.builtOn}</strong>
            </span>
            <span className="text-slate-900 font-extrabold" title="Total">
              Tot: {metrics.total}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 bg-slate-50/80 rounded-lg border border-slate-100 text-center mb-2.5">
            <div>
              <span className="block text-[9px] text-blue-600 font-bold uppercase tracking-wider">
                Insights
              </span>
              <span className="text-sm font-extrabold text-blue-900 tabular-nums">
                {metrics.insights}
              </span>
            </div>
            <div className="border-x border-slate-200">
              <span className="block text-[9px] text-amber-600 font-bold uppercase tracking-wider">
                Questions
              </span>
              <span className="text-sm font-extrabold text-amber-900 tabular-nums">
                {metrics.questions}
              </span>
            </div>
            <div>
              <span className="block text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                Built On
              </span>
              <span className="text-sm font-extrabold text-emerald-900 tabular-nums">
                {metrics.builtOn}
              </span>
            </div>
          </div>
        )}

        {/* Footer info (Spacious only) */}
        {!isCompact && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-semibold text-slate-600">
              Total: <strong className="text-slate-900 tabular-nums">{metrics.total}</strong>
            </span>
            <span className="text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center">
              <span>+ Log</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
