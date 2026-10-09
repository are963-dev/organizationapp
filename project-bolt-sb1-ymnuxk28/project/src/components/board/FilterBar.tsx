import { Filter, X } from 'lucide-react';
import { OFFICIAL_PRIORITIES, WORK_QUEUES } from '@/constants';
import { useTickets } from '@/context/TicketContext';
import type { OfficialPriority, WorkQueue } from '@/types';

export interface FilterState {
  workQueue: WorkQueue | 'all';
  officialPriority: OfficialPriority | 'all';
  source: string | 'all';
  company: string | 'all';
  followUp: 'all' | 'overdue' | 'upcoming' | 'none';
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const { activeTickets, settings } = useTickets();

  const companies = Array.from(
    new Set(activeTickets.map((t) => t.company).filter(Boolean))
  ).sort();

  const hasActiveFilters =
    filters.workQueue !== 'all' ||
    filters.officialPriority !== 'all' ||
    filters.source !== 'all' ||
    filters.company !== 'all' ||
    filters.followUp !== 'all';

  const update = (patch: Partial<FilterState>) =>
    onFiltersChange({ ...filters, ...patch });

  const clearAll = () =>
    onFiltersChange({
      workQueue: 'all',
      officialPriority: 'all',
      source: 'all',
      company: 'all',
      followUp: 'all',
    });

  const selectClass =
    'rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 transition-colors cursor-pointer';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
        <Filter size={15} />
        Filters:
      </div>

      <select
        className={selectClass}
        value={filters.workQueue}
        onChange={(e) => update({ workQueue: e.target.value as FilterState['workQueue'] })}
      >
        <option value="all">All Work Queues</option>
        {WORK_QUEUES.map((q) => (
          <option key={q} value={q}>{q}</option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.officialPriority}
        onChange={(e) => update({ officialPriority: e.target.value as FilterState['officialPriority'] })}
      >
        <option value="all">All Priorities</option>
        {OFFICIAL_PRIORITIES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.source}
        onChange={(e) => update({ source: e.target.value })}
      >
        <option value="all">All Sources</option>
        {settings.ticketSources.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.company}
        onChange={(e) => update({ company: e.target.value })}
      >
        <option value="all">All Companies</option>
        {companies.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.followUp}
        onChange={(e) => update({ followUp: e.target.value as FilterState['followUp'] })}
      >
        <option value="all">All Follow-ups</option>
        <option value="overdue">Overdue</option>
        <option value="upcoming">Has Follow-up</option>
        <option value="none">No Follow-up</option>
      </select>

      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
