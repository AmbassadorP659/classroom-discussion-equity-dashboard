import React, { useState, useEffect } from 'react';
import {
  Mic,
  X,
  Lightbulb,
  HelpCircle,
  Link as LinkIcon,
  CheckCircle2,
  Circle,
  Plus,
  Users,
  GraduationCap,
  LayoutGrid,
  UserCheck,
  User,
  Check,
} from 'lucide-react';
import { Student, ContributionType } from '../types';

interface RecordModalProps {
  student: Student | null;
  allStudents: Student[];
  onClose: () => void;
  onSubmit: (student: Student, type: ContributionType, target: string) => void;
}

export type TargetOption = 'Whole Class (Open Discussion)' | 'Teacher' | 'Table Group' | 'Peer';

export const RecordModal: React.FC<RecordModalProps> = ({
  student,
  allStudents,
  onClose,
  onSubmit,
}) => {
  const [selectedType, setSelectedType] = useState<ContributionType>('New Insight');
  const [targetCategory, setTargetCategory] = useState<TargetOption>('Whole Class (Open Discussion)');
  const [selectedPeerId, setSelectedPeerId] = useState<string>('');

  const peers = student ? allStudents.filter((s) => s.id !== student.id) : [];

  useEffect(() => {
    if (student) {
      setSelectedType('New Insight');
      setTargetCategory('Whole Class (Open Discussion)');
      if (peers.length > 0) {
        setSelectedPeerId(peers[0].id);
      }
    }
  }, [student]);

  // When contribution type changes to 'Built on Peer', auto-switch target to 'Peer'
  const handleTypeChange = (type: ContributionType) => {
    setSelectedType(type);
    if (type === 'Built on Peer') {
      setTargetCategory('Peer');
    }
  };

  if (!student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalTarget: string = targetCategory;
    if (targetCategory === 'Peer') {
      const peer = peers.find((p) => p.id === selectedPeerId) || peers[0];
      finalTarget = peer ? `Peer: ${peer.name} (Seat #${peer.seat})` : 'Peer';
    }

    onSubmit(student, selectedType, finalTarget);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <Mic className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">{student.name}</h3>
              <p className="text-xs text-blue-200 font-mono">Assigned Seat #{student.seat}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Step 1: Contribution Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              1. Contribution Type:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: New Insight */}
              <button
                type="button"
                onClick={() => handleTypeChange('New Insight')}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedType === 'New Insight'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Lightbulb className="w-3.5 h-3.5" />
                  </span>
                  {selectedType === 'New Insight' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <strong className="block text-xs font-bold text-slate-900">New Insight</strong>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    Original idea, thesis, or analysis
                  </span>
                </div>
              </button>

              {/* Option 2: Question Posed */}
              <button
                type="button"
                onClick={() => handleTypeChange('Question Posed')}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedType === 'Question Posed'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </span>
                  {selectedType === 'Question Posed' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div>
                  <strong className="block text-xs font-bold text-slate-900">Question Posed</strong>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    Clarifying inquiry or provocation
                  </span>
                </div>
              </button>

              {/* Option 3: Built on Peer */}
              <button
                type="button"
                onClick={() => handleTypeChange('Built on Peer')}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedType === 'Built on Peer'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <LinkIcon className="w-3.5 h-3.5" />
                  </span>
                  {selectedType === 'Built on Peer' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div>
                  <strong className="block text-xs font-bold text-slate-900">Built on Peer</strong>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    Connected to classmate's point
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Interaction Target Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              2. Interaction Target:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Option 1: Whole Class */}
              <button
                type="button"
                onClick={() => setTargetCategory('Whole Class (Open Discussion)')}
                className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  targetCategory === 'Whole Class (Open Discussion)'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Users className={`w-4 h-4 mb-1 ${targetCategory === 'Whole Class (Open Discussion)' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold leading-tight">Whole Class</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Open discussion</span>
              </button>

              {/* Option 2: Teacher */}
              <button
                type="button"
                onClick={() => setTargetCategory('Teacher')}
                className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  targetCategory === 'Teacher'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <GraduationCap className={`w-4 h-4 mb-1 ${targetCategory === 'Teacher' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold leading-tight">Teacher</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Direct address</span>
              </button>

              {/* Option 3: Table Group */}
              <button
                type="button"
                onClick={() => setTargetCategory('Table Group')}
                className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  targetCategory === 'Table Group'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <LayoutGrid className={`w-4 h-4 mb-1 ${targetCategory === 'Table Group' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold leading-tight">Table Group</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Pod interaction</span>
              </button>

              {/* Option 4: Peer */}
              <button
                type="button"
                onClick={() => setTargetCategory('Peer')}
                className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  targetCategory === 'Peer'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <UserCheck className={`w-4 h-4 mb-1 ${targetCategory === 'Peer' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold leading-tight">Peer</span>
                <span className="text-[9px] text-emerald-600 font-semibold mt-0.5">Select roster</span>
              </button>
            </div>
          </div>

          {/* Step 3: Peer Roster List (Appears when Peer is chosen) */}
          {targetCategory === 'Peer' && (
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <label className="block text-xs font-bold text-emerald-900 flex items-center justify-between">
                <span className="flex items-center">
                  <User className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Select Target Peer from Roster:
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-medium">
                  {peers.length} Classmates Available
                </span>
              </label>

              <select
                value={selectedPeerId}
                onChange={(e) => setSelectedPeerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              >
                {peers.map((peer) => (
                  <option key={peer.id} value={peer.id}>
                    {peer.name} (Seat #{peer.seat})
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-emerald-700 font-medium">
                This interaction will be logged as targeted toward this specific classmate.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-700/30 transition-all flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Log Contribution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
