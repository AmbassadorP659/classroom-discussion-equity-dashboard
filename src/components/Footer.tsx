import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200/80 py-3 px-4 text-center select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[11px] sm:text-xs text-slate-400 font-medium">
        <span>Created by Chris Pirkl</span>
        <span className="hidden sm:inline text-slate-300">|</span>
        <span>Maine Department of Education</span>
        <span className="text-slate-300">•</span>
        <span>Classroom Equity Dashboard</span>
        <span className="text-slate-300">•</span>
        <span>&copy; 2026</span>
      </div>
    </footer>
  );
};
