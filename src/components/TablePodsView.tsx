import React, { useState } from 'react';
import {
  Users,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Check,
  LayoutGrid,
  Settings2,
} from 'lucide-react';
import {
  Student,
  StudentMetrics,
  EquityTier,
  EquityThresholds,
  CardDensity,
  PodConfig,
} from '../types';
import { StudentCard } from './StudentCard';

interface TablePodsViewProps {
  students: Student[];
  metrics: Record<string, StudentMetrics>;
  thresholds: EquityThresholds;
  cardDensity: CardDensity;
  globalPodSize: number;
  onChangeGlobalPodSize: (newSize: number) => void;
  pods: PodConfig[];
  onUpdatePod: (podId: string, updates: Partial<PodConfig>) => void;
  onAddPod: () => void;
  onDeletePod: (podId: string) => void;
  onSelectStudent: (student: Student) => void;
  onMoveStudent: (sourceId: string, targetId: string) => void;
  onMoveStudentToSlot: (sourceId: string, targetStudentIndex: number) => void;
  getEquityTier: (metricValue: number) => EquityTier;
  draggedStudentId: string | null;
  dragOverStudentId: string | null;
  onDragStart: (e: React.DragEvent, studentId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, studentId: string) => void;
  onDragLeave: (studentId: string) => void;
  onDrop: (e: React.DragEvent, targetStudentId: string) => void;
}

export const TablePodsView: React.FC<TablePodsViewProps> = ({
  students,
  metrics,
  thresholds,
  cardDensity,
  globalPodSize,
  onChangeGlobalPodSize,
  pods,
  onUpdatePod,
  onAddPod,
  onDeletePod,
  onSelectStudent,
  onMoveStudentToSlot,
  getEquityTier,
  draggedStudentId,
  dragOverStudentId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const [editingPodId, setEditingPodId] = useState<string | null>(null);
  const [editingPodName, setEditingPodName] = useState<string>('');
  const [dragOverPodIndex, setDragOverPodIndex] = useState<number | null>(null);

  const basisLabel = thresholds.basis === 'total' ? 'Total' : 'Insights';

  // Partition students across pods based on each pod's configured capacity
  let currentIndex = 0;
  const podAllocations = pods.map((pod, podIdx) => {
    const capacity = Math.max(1, pod.capacity || globalPodSize);
    const assignedStudents = students.slice(currentIndex, currentIndex + capacity);
    const startIndex = currentIndex;
    currentIndex += assignedStudents.length;

    return {
      pod,
      podIdx,
      assignedStudents,
      capacity,
      startIndex,
      emptySlotsCount: Math.max(0, capacity - assignedStudents.length),
    };
  });

  const handleStartRename = (pod: PodConfig) => {
    setEditingPodId(pod.id);
    setEditingPodName(pod.name);
  };

  const handleSaveRename = (podId: string) => {
    const trimmed = editingPodName.trim();
    if (trimmed) {
      onUpdatePod(podId, { name: trimmed });
    }
    setEditingPodId(null);
  };

  return (
    <div className="space-y-5">
      {/* Global Pod Controls Bar */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-slate-50 border border-blue-200/80 rounded-2xl p-3.5 sm:p-4.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center">
              <span>Table Pods Classroom Configuration</span>
              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800 font-bold">
                {pods.length} Tables Active
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Configure default pod size globally, or fine-tune individual table capacities below.
            </p>
          </div>
        </div>

        {/* Global Pod Size Stepper */}
        <div className="flex items-center space-x-3 bg-white p-1.5 px-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-slate-700">
            <Settings2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-bold">Default Pod Size:</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={globalPodSize <= 1}
              onClick={() => onChangeGlobalPodSize(Math.max(1, globalPodSize - 1))}
              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer"
              title="Decrease default students per pod"
            >
              <Minus className="w-3 h-3" />
            </button>

            <span className="w-8 text-center text-xs font-extrabold text-blue-900 font-mono">
              {globalPodSize}
            </span>

            <button
              type="button"
              disabled={globalPodSize >= 12}
              onClick={() => onChangeGlobalPodSize(Math.min(12, globalPodSize + 1))}
              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer"
              title="Increase default students per pod"
            >
              <Plus className="w-3 h-3" />
            </button>
            <span className="text-[11px] text-slate-500 font-medium pl-0.5">students/pod</span>
          </div>

          <div className="border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={onAddPod}
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Table
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Table Pod Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {podAllocations.map(({ pod, podIdx, assignedStudents, capacity, startIndex, emptySlotsCount }) => {
          // Compute aggregated table metrics
          let podInsights = 0;
          let podTotal = 0;
          assignedStudents.forEach((s) => {
            const d = metrics[s.id];
            if (d) {
              podInsights += d.insights;
              podTotal += d.total;
            }
          });

          const isPodHovered = dragOverPodIndex === podIdx;

          return (
            <div
              key={pod.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverPodIndex(podIdx);
              }}
              onDragLeave={() => {
                if (dragOverPodIndex === podIdx) setDragOverPodIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const sourceId = e.dataTransfer.getData('text/plain') || draggedStudentId;
                if (sourceId) {
                  // If dropped onto pod container, insert at end of this pod's assigned list
                  const targetIndex = startIndex + assignedStudents.length;
                  onMoveStudentToSlot(sourceId, targetIndex);
                }
                setDragOverPodIndex(null);
              }}
              className={`bg-slate-50/90 rounded-2xl border-2 transition-all p-4.5 flex flex-col justify-between shadow-2xs ${
                isPodHovered
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-300'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Pod Header */}
                <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-200">
                  <div className="flex items-center space-x-2 flex-1 mr-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">
                      {podIdx + 1}
                    </span>

                    {editingPodId === pod.id ? (
                      <div className="flex items-center space-x-1.5 flex-1">
                        <input
                          type="text"
                          autoFocus
                          value={editingPodName}
                          onChange={(e) => setEditingPodName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(pod.id);
                            if (e.key === 'Escape') setEditingPodId(null);
                          }}
                          className="px-2 py-1 bg-white border border-blue-400 rounded-lg text-xs font-bold text-slate-900 w-full focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(pod.id)}
                          className="p-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 group/edit">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {pod.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleStartRename(pod)}
                          className="p-1 text-slate-400 hover:text-slate-700 opacity-0 group-hover/edit:opacity-100 transition-opacity cursor-pointer"
                          title="Rename table pod"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Table Voice Score */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                      Voice Score
                    </span>
                    <span className="text-xs font-extrabold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                      {thresholds.basis === 'total' ? podTotal : podInsights} {basisLabel}
                    </span>
                  </div>
                </div>

                {/* Individual Pod Capacity Stepper Bar */}
                <div className="flex items-center justify-between bg-white/80 p-2 rounded-xl border border-slate-200 mb-3 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-semibold">
                      Seated: <strong className="text-slate-900">{assignedStudents.length}</strong> / {capacity}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Capacity:</span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        disabled={capacity <= 1}
                        onClick={() =>
                          onUpdatePod(pod.id, { capacity: Math.max(1, capacity - 1) })
                        }
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer"
                        title="Reduce capacity of this pod"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>

                      <span className="w-5 text-center text-xs font-bold text-slate-900 font-mono">
                        {capacity}
                      </span>

                      <button
                        type="button"
                        disabled={capacity >= 12}
                        onClick={() =>
                          onUpdatePod(pod.id, { capacity: Math.min(12, capacity + 1) })
                        }
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer"
                        title="Increase capacity of this pod"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {pods.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeletePod(pod.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 ml-1 cursor-pointer"
                        title="Delete table pod"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Seated Students inside this Pod */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {assignedStudents.map((student) => {
                    const data = metrics[student.id] || {
                      student,
                      insights: 0,
                      questions: 0,
                      builtOn: 0,
                      total: 0,
                    };
                    const evalVal =
                      thresholds.basis === 'total' ? data.total : data.insights;
                    const tier = getEquityTier(evalVal);

                    return (
                      <StudentCard
                        key={student.id}
                        student={student}
                        metrics={data}
                        tier={tier}
                        density={cardDensity}
                        isDragging={draggedStudentId === student.id}
                        isDragOver={dragOverStudentId === student.id}
                        onDragStart={(e) => onDragStart(e, student.id)}
                        onDragEnd={onDragEnd}
                        onDragOver={(e) => onDragOver(e, student.id)}
                        onDragLeave={() => onDragLeave(student.id)}
                        onDrop={(e) => onDrop(e, student.id)}
                        onSelect={() => onSelectStudent(student)}
                        orientationHint={pod.name}
                      />
                    );
                  })}

                  {/* Empty seat slots if capacity exceeds current seated count */}
                  {Array.from({ length: emptySlotsCount }).map((_, slotIdx) => (
                    <div
                      key={`empty-slot-${slotIdx}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceId =
                          e.dataTransfer.getData('text/plain') || draggedStudentId;
                        if (sourceId) {
                          const targetSlotIndex = startIndex + assignedStudents.length + slotIdx;
                          onMoveStudentToSlot(sourceId, targetSlotIndex);
                        }
                      }}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white/60 hover:bg-blue-50/40 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all min-h-[90px] cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-slate-400 mb-1" />
                      <span className="text-[11px] font-bold text-slate-500">
                        Empty Seat
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Drop student here
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
