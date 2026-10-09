import type { ReactNode } from 'react';

interface SummaryCardProps {
  label: string;
  count: number;
  icon: ReactNode;
  accent: string;
  iconBg: string;
  onClick?: () => void;
}

export function SummaryCard({ label, count, icon, accent, iconBg, onClick }: SummaryCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left transition-all hover:border-slate-300 hover:shadow-sm ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } ${accent}`}
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{count}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
      </div>
    </button>
  );
}
