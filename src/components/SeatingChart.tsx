import React, { useState, useRef, useEffect } from 'react';
import {
  Presentation,
  Sliders,
  Plus,
  Trash2,
  Check,
  Grid as GridIcon,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Layers,
  ChevronDown,
  X,
  Info,
} from 'lucide-react';
import {
  Student,
  StudentMetrics,
  EquityTier,
  EquityThresholds,
  LayoutMode,
  CardDensity,
  PodConfig,
  LayoutPreset,
} from '../types';
import { StudentCard } from './StudentCard';
import { TablePodsView } from './TablePodsView';

interface SeatingChartProps {
  students: Student[];
  metrics: Record<string, StudentMetrics>;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  cardDensity: CardDensity;
  setCardDensity: (density: CardDensity) => void;
  thresholds: EquityThresholds;
  globalPodSize: number;
  onChangeGlobalPodSize: (newSize: number) => void;
  pods: PodConfig[];
  onUpdatePod: (podId: string, updates: Partial<PodConfig>) => void;
  onAddPod: () => void;
  onDeletePod: (podId: string) => void;
  presets: LayoutPreset[];
  activePresetId: string | null;
  onApplyPreset: (preset: LayoutPreset) => void;
  onOpenSavePresetModal: () => void;
  onDeletePreset: (presetId: string) => void;
  onOpenThresholdModal: () => void;
  onSelectStudent: (student: Student) => void;
  onMoveStudent: (sourceStudentId: string, targetStudentId: string) => void;
  onMoveStudentToSlot: (sourceId: string, targetIndex: number) => void;
  getEquityTier: (metricValue: number) => EquityTier;
}

export const SeatingChart: React.FC<SeatingChartProps> = ({
  students,
  metrics,
  layoutMode,
  setLayoutMode,
  cardDensity,
  setCardDensity,
  thresholds,
  globalPodSize,
  onChangeGlobalPodSize,
  pods,
  onUpdatePod,
  onAddPod,
  onDeletePod,
  presets,
  activePresetId,
  onApplyPreset,
  onOpenSavePresetModal,
  onDeletePreset,
  onOpenThresholdModal,
  onSelectStudent,
  onMoveStudent,
  onMoveStudentToSlot,
  getEquityTier,
}) => {
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [dragOverStudentId, setDragOverStudentId] = useState<string | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const legendPopoverRef = useRef<HTMLDivElement>(null);

  const basisLabel = thresholds.basis === 'total' ? 'Total Contributions' : 'Insights Only';

  // Handle outside click & escape to close equity legend popover
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (legendPopoverRef.current && !legendPopoverRef.current.contains(event.target as Node)) {
        setIsLegendOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLegendOpen(false);
      }
    };

    if (isLegendOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLegendOpen]);

  // Drag and Drop helpers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedStudentId(id);
  };

  const handleDragEnd = () => {
    setDraggedStudentId(null);
    setDragOverStudentId(null);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStudentId !== id) {
      setDragOverStudentId(id);
    }
  };

  const handleDragLeave = (id: string) => {
    if (dragOverStudentId === id) {
      setDragOverStudentId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedStudentId;
    if (sourceId && sourceId !== targetId) {
      onMoveStudent(sourceId, targetId);
    }
    setDraggedStudentId(null);
    setDragOverStudentId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-7 relative overflow-hidden">
      {/* Front of Classroom Teacher Desk Banner */}
      <div className="relative mb-4 text-center">
        <div className="inline-flex items-center justify-center px-6 py-2 rounded-xl bg-gradient-to-r from-slate-800 via-blue-950 to-slate-800 text-white shadow-md border border-slate-700/60">
          <Presentation className="w-4 h-4 text-blue-400 mr-2" />
          <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-blue-100">
            Front of Classroom / Teacher Desk
          </span>
          <span className="ml-3 px-2 py-0.5 bg-blue-500/30 rounded text-[10px] text-blue-200 font-mono">
            Stage Left ⇄ Stage Right
          </span>
        </div>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mt-2"></div>
      </div>

      {/* Student Desks Card Container with Sleek Single-Line Modifier Toolbar */}
      <div className="bg-slate-50/60 rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Streamlined Single-Line Toolbar: Card Layout, Density & Collapsible Equity Legend */}
        <div className="bg-white border-b border-slate-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Left: Card Layout & Density Modifiers */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Card Layout (Adaptive Grid vs Table Pods) */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <Layers className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                Layout:
              </span>
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setLayoutMode('grid')}
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    layoutMode === 'grid'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GridIcon className="w-3.5 h-3.5 mr-1" />
                  Adaptive Grid
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('pods')}
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    layoutMode === 'pods'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 mr-1" />
                  Table Pods
                </button>
              </div>
            </div>

            {/* Card Density (Compact vs Spacious) */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                Density:
              </span>
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCardDensity('compact')}
                  className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                    cardDensity === 'compact'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Compact View: fits 24+ desks"
                >
                  <Minimize2 className="w-3 h-3 mr-1" />
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => setCardDensity('spacious')}
                  className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                    cardDensity === 'spacious'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Spacious View: larger cards and visible metrics"
                >
                  <Maximize2 className="w-3 h-3 mr-1" />
                  Spacious
                </button>
              </div>
            </div>

            {/* Presets (Compact list if any) */}
            {presets.length > 0 && (
              <div className="hidden lg:flex items-center space-x-1 border-l border-slate-200 pl-2">
                <span className="text-[11px] font-semibold text-slate-500">Preset:</span>
                <div className="flex items-center space-x-1">
                  {presets.slice(0, 2).map((preset) => {
                    const isActive = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onApplyPreset(preset)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {preset.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onOpenSavePresetModal}
              className="hidden xl:inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Save current seating configuration"
            >
              <Plus className="w-3 h-3 mr-1 text-indigo-600" />
              Save Preset
            </button>
          </div>

          {/* Right: Collapsible Voice Equity Status Legend Pill */}
          <div className="relative" ref={legendPopoverRef}>
            <button
              type="button"
              onClick={() => setIsLegendOpen((prev) => !prev)}
              className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                isLegendOpen
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs hover:border-slate-300'
              }`}
              title="Click to view Voice Equity cutoffs & thresholds"
              aria-expanded={isLegendOpen}
            >
              {/* Visual 3-Dot Status Indicator */}
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" title="Low Voice"></span>
                <span className="w-2 h-2 rounded-full bg-amber-400" title="Balanced Voice"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="High Voice"></span>
              </span>
              <span className="font-bold text-[11px] tracking-wide text-slate-700">
                Voice Equity Legend
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isLegendOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Collapsible Popover Card */}
            {isLegendOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-xs text-slate-900">Voice Equity Status</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLegendOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Calculation Basis:</span>
                  <span className="font-bold text-indigo-700 font-mono">{basisLabel}</span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Low Voice */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs"></span>
                      <span className="font-bold text-rose-900">Low Voice</span>
                    </div>
                    <span className="font-mono text-rose-800 font-semibold text-[11px]">
                      ≤ {thresholds.lowMax} interactions
                    </span>
                  </div>

                  {/* Balanced Voice */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs"></span>
                      <span className="font-bold text-amber-900">Balanced Voice</span>
                    </div>
                    <span className="font-mono text-amber-800 font-semibold text-[11px]">
                      {thresholds.lowMax + 1}–{thresholds.balancedMax} interactions
                    </span>
                  </div>

                  {/* High Voice */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs"></span>
                      <span className="font-bold text-emerald-900">High Voice</span>
                    </div>
                    <span className="font-mono text-emerald-800 font-semibold text-[11px]">
                      &gt; {thresholds.balancedMax} interactions
                    </span>
                  </div>
                </div>

                {/* Popover Footer: Open Threshold Settings Modal */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Need custom cutoffs?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLegendOpen(false);
                      onOpenThresholdModal();
                    }}
                    className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer border border-indigo-200/70"
                  >
                    <Sliders className="w-3 h-3 mr-1.5 text-indigo-600" />
                    Configure Thresholds
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Student Cards Grid / Pods Content Area */}
        <div className="p-4 sm:p-5">
          {/* VIEW 1: Adaptive Responsive Grid */}
          {layoutMode === 'grid' && (
            <div
              className={`grid gap-3 sm:gap-4 transition-all duration-200 ${
                cardDensity === 'compact'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}
            >
              {students.map((student) => {
                const data = metrics[student.id] || {
                  student,
                  insights: 0,
                  questions: 0,
                  builtOn: 0,
                  total: 0,
                };
                const evalValue =
                  thresholds.basis === 'total' ? data.total : data.insights;
                const tier = getEquityTier(evalValue);

                return (
                  <StudentCard
                    key={student.id}
                    student={student}
                    metrics={data}
                    tier={tier}
                    density={cardDensity}
                    isDragging={draggedStudentId === student.id}
                    isDragOver={dragOverStudentId === student.id}
                    onDragStart={(e) => handleDragStart(e, student.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, student.id)}
                    onDragLeave={() => handleDragLeave(student.id)}
                    onDrop={(e) => handleDrop(e, student.id)}
                    onSelect={() => onSelectStudent(student)}
                  />
                );
              })}
            </div>
          )}

          {/* VIEW 2: Table Pods (Cooperative Group Islands) */}
          {layoutMode === 'pods' && (
            <TablePodsView
              students={students}
              metrics={metrics}
              thresholds={thresholds}
              cardDensity={cardDensity}
              globalPodSize={globalPodSize}
              onChangeGlobalPodSize={onChangeGlobalPodSize}
              pods={pods}
              onUpdatePod={onUpdatePod}
              onAddPod={onAddPod}
              onDeletePod={onDeletePod}
              onSelectStudent={onSelectStudent}
              onMoveStudent={onMoveStudent}
              onMoveStudentToSlot={onMoveStudentToSlot}
              getEquityTier={getEquityTier}
              draggedStudentId={draggedStudentId}
              dragOverStudentId={dragOverStudentId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          )}
        </div>
      </div>
    </div>
  );
};
