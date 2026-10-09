import { useState, useMemo } from 'react';
import {
  Archive as ArchiveIcon,
  Search,
  RotateCcw,
  Inbox,
  Building2,
  Calendar,
} from 'lucide-react';
import { useTickets } from '@/context/TicketContext';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { OFFICIAL_PRIORITIES } from '@/constants';
import { formatDate, formatDateTime } from '@/utils';
import type { OfficialPriority } from '@/types';

interface ArchivePageProps {
  onOpenTicket: (id: string) => void;
}

export function ArchivePage({ onOpenTicket }: ArchivePageProps) {
  const { archivedTickets, settings, restoreTicket } = useTickets();

  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<OfficialPriority | 'all'>('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');

  const companies = useMemo(
    () => Array.from(new Set(archivedTickets.map((t) => t.company).filter(Boolean))).sort(),
    [archivedTickets]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return archivedTickets.filter((t) => {
      if (filterPriority !== 'all' && t.officialPriority !== filterPriority) return false;
      if (filterSource !== 'all' && t.source !== filterSource) return false;
      if (filterCompany !== 'all' && t.company !== filterCompany) return false;
      if (!q) return true;
      return (
        t.ticketNumber.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.company.toLowerCase().includes(q) ||
        t.primaryContact.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        t.updates.some((u) => u.text.toLowerCase().includes(q))
      );
    });
  }, [archivedTickets, search, filterPriority, filterSource, filterCompany]);

  const selectClass =
    'rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 transition-colors cursor-pointer';

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search archived tickets..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <select
          className={selectClass}
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as OfficialPriority | 'all')}
        >
          <option value="all">All Priorities</option>
          {OFFICIAL_PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
        >
          <option value="all">All Sources</option>
          {settings.ticketSources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
        >
          <option value="all">All Companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <ArchiveIcon size={28} className="text-slate-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-600">
            {archivedTickets.length === 0 ? 'No archived tickets' : 'No tickets match your filters'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {archivedTickets.length === 0
              ? 'Completed tickets will appear here'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ticket) => (
            <div
              key={ticket.id}
              className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium text-slate-500">
                  {ticket.ticketNumber}
                </span>
                <PriorityBadge priority={ticket.officialPriority} />
              </div>

              <button
                onClick={() => onOpenTicket(ticket.id)}
                className="mt-1.5 block w-full text-left"
              >
                <p className="text-sm font-semibold text-slate-900 hover:text-slate-700 line-clamp-2">
                  {ticket.title}
                </p>
              </button>

              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Building2 size={12} className="shrink-0" />
                  <span className="truncate">{ticket.company || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="shrink-0" />
                  <span>Completed: {formatDate(ticket.completedAt)}</span>
                </div>
              </div>

              {ticket.resolution && (
                <p className="mt-2 text-xs text-slate-500 line-clamp-2 italic">
                  "{ticket.resolution}"
                </p>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <span className="text-xs text-slate-400">
                  {ticket.updates.length} updates
                </span>
                <button
                  onClick={() => restoreTicket(ticket.id)}
                  className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <RotateCcw size={12} />
                  Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
