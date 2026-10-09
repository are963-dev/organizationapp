import { useState, useEffect, useRef } from 'react';
import { Plus, Zap, Search, X, RefreshCw, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { useSync, type SyncStatus } from '@/context/SyncContext';
import { relativeTime } from '@/utils';
import type { SyncSummary } from '@/types';

interface HeaderProps {
  search: string;
  onSearchChange: (val: string) => void;
  onAddTicket: () => void;
  onQuickAdd: () => void;
  title: string;
}

function SyncIndicator() {
  const { syncSettings, syncStatus, syncNow, isSyncing } = useSync();
  const [showSummary, setShowSummary] = useState(false);
  const summaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const summary = syncSettings.lastSyncSummary;

  useEffect(() => {
    if (summary && summary.timestamp === syncSettings.lastSuccessfulSync) {
      setShowSummary(true);
      if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
      summaryTimerRef.current = setTimeout(() => setShowSummary(false), 6000);
    }
    return () => {
      if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
    };
  }, [syncSettings.lastSuccessfulSync, summary]);

  const handleSync = async () => {
    const result = await syncNow();
    if (result) {
      setShowSummary(true);
      if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
      summaryTimerRef.current = setTimeout(() => setShowSummary(false), 6000);
    }
  };

  const statusConfig: Record<SyncStatus, { icon: typeof Circle; color: string; label: string }> = {
    syncing: { icon: RefreshCw, color: 'text-sky-600', label: 'Syncing...' },
    synced: { icon: CheckCircle2, color: 'text-emerald-600', label: `Synced ${relativeTime(syncSettings.lastSuccessfulSync)}` },
    error: { icon: AlertCircle, color: 'text-red-500', label: 'Sync failed' },
    never: { icon: Circle, color: 'text-slate-400', label: 'Not synced' },
    idle: { icon: Circle, color: 'text-slate-400', label: 'Not synced' },
  };

  const cfg = statusConfig[syncStatus];
  const StatusIcon = cfg.icon;

  return (
    <div className="relative flex items-center gap-2">
      {/* Sync status indicator */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <StatusIcon
          size={14}
          className={`${cfg.color} ${isSyncing ? 'animate-spin' : ''}`}
        />
        <span className="hidden sm:inline">{cfg.label}</span>
      </div>

      {/* Sync Now button */}
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Sync with QMON now"
      >
        <RefreshCw size={16} className={isSyncing ? 'animate-spin text-sky-600' : 'text-slate-500'} />
        <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
      </button>

      {/* Sync summary popover */}
      {showSummary && summary && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
          <div className="flex items-start justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="text-sm font-semibold text-slate-900">Sync complete</span>
            </div>
            <button
              onClick={() => setShowSummary(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </div>
          <div className="px-4 py-3 space-y-1.5 text-sm text-slate-600">
            <SummaryLine label="Tickets checked" value={summary.checked} />
            {summary.added > 0 ? <SummaryLine label="New" value={summary.added} highlight="text-emerald-600" /> : null}
            {summary.updated > 0 ? <SummaryLine label="Updated" value={summary.updated} highlight="text-sky-600" /> : null}
            {summary.archived > 0 ? <SummaryLine label="Archived" value={summary.archived} highlight="text-slate-500" /> : null}
            {summary.reopened > 0 ? <SummaryLine label="Reopened" value={summary.reopened} highlight="text-orange-600" /> : null}
            {summary.unchanged > 0 ? <SummaryLine label="Unchanged" value={summary.unchanged} /> : null}
            {summary.added === 0 && summary.updated === 0 && summary.archived === 0 && summary.reopened === 0 && (
              <p className="text-slate-400 italic">No changes detected</p>
            )}
          </div>
        </div>
      )}

      {/* Error popover */}
      {syncStatus === 'error' && syncSettings.lastError && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-red-200 bg-white shadow-lg z-50">
          <div className="flex items-start gap-2 px-4 py-3">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Unable to synchronize with QMON</p>
              <p className="mt-1 text-xs text-slate-500">
                Your existing ticket data has been preserved.
              </p>
              {syncSettings.lastSuccessfulSync && (
                <p className="mt-1 text-xs text-slate-400">
                  Last successful sync: {relativeTime(syncSettings.lastSuccessfulSync)}
                </p>
              )}
              <p className="mt-1 text-xs text-red-500 break-words">{syncSettings.lastError}</p>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="mt-2 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryLine({ label, value, highlight }: { label: string; value: number; highlight?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className={`font-semibold ${highlight ?? 'text-slate-700'}`}>{value}</span>
    </div>
  );
}

export function Header({ search, onSearchChange, onAddTicket, onQuickAdd, title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900 whitespace-nowrap">{title}</h2>

      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tickets, contacts, companies, tags..."
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-9 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <SyncIndicator />
        <button
          onClick={onQuickAdd}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Zap size={16} className="text-amber-500" />
          Quick Add
        </button>
        <button
          onClick={onAddTicket}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          <Plus size={16} />
          Add Ticket
        </button>
      </div>
    </header>
  );
}
