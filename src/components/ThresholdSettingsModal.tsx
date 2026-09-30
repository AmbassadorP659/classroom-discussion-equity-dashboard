import React, { useState, useEffect } from 'react';
import { Sliders, X, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react';
import { EquityThresholds } from '../types';

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: EquityThresholds;
  onSave: (thresholds: EquityThresholds) => void;
  onReset: () => void;
}

export const defaultThresholds: EquityThresholds = {
  basis: 'insights',
  lowMax: 2,
  balancedMax: 5,
};

export const ThresholdSettingsModal: React.FC<ThresholdSettingsModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSave,
  onReset,
}) => {
  const [basis, setBasis] = useState<'insights' | 'total'>(thresholds.basis);
  const [lowMax, setLowMax] = useState<number>(thresholds.lowMax);
  const [balancedMax, setBalancedMax] = useState<number>(thresholds.balancedMax);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBasis(thresholds.basis);
      setLowMax(thresholds.lowMax);
      setBalancedMax(thresholds.balancedMax);
      setError(null);
    }
  }, [isOpen, thresholds]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (lowMax < 0) {
      setError('Low voice threshold cannot be negative.');
      return;
    }
    if (balancedMax <= lowMax) {
      setError('Balanced threshold ceiling must be greater than low voice ceiling.');
      return;
    }
    onSave({
      basis,
      lowMax,
      balancedMax,
    });
    onClose();
  };

  const handleReset = () => {
    setBasis(defaultThresholds.basis);
    setLowMax(defaultThresholds.lowMax);
    setBalancedMax(defaultThresholds.balancedMax);
    setError(null);
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 border border-white/20">
              <Sliders className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">Configure Voice Equity Thresholds</h3>
              <p className="text-xs text-blue-200">
                Customize engagement benchmarks and calculation basis
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

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Metric Basis Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              1. Evaluate Engagement By:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBasis('insights')}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  basis === 'insights'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">New Insights Only</span>
                  {basis === 'insights' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Focuses strictly on original analysis, thesis, and novel thoughts.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setBasis('total')}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  basis === 'total'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Total Contributions</span>
                  {basis === 'total' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Includes all insights, questions posed, and peer builds combined.
                </p>
              </button>
            </div>
          </div>

          {/* Threshold Cutoffs */}
          <div className="space-y-3.5 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Adjust Tier Cutoffs:
            </label>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              {/* Low Voice Max */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="text-xs font-bold text-slate-800">Low Voice Ceiling (≤)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Students at or below this count receive a quiet voice prompt.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max={balancedMax - 1}
                    value={lowMax}
                    onChange={(e) => setLowMax(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Balanced Max */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-bold text-slate-800">Balanced Ceiling (≤)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Range: from {lowMax + 1} up to this ceiling number.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={lowMax + 1}
                    max="99"
                    value={balancedMax}
                    onChange={(e) =>
                      setBalancedMax(Math.max(lowMax + 1, parseInt(e.target.value) || lowMax + 1))
                    }
                    className="w-16 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Display */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block mb-2">
              Live Threshold Status Preview:
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Low Voice: ≤ {lowMax}</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>
                  Balanced: {lowMax + 1}–{balancedMax}
                </span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>High Voice: &gt; {balancedMax}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Reset to Defaults
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Apply &amp; Save Thresholds
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
