import { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  Database,
  CloudOff,
} from 'lucide-react';
import { useSync } from '@/context/SyncContext';
import { QMON_URL, SYNC_INTERVAL_OPTIONS } from '@/constants';
import { formatDateTime, relativeTime } from '@/utils';
import type { SyncIntervalMinutes } from '@/types';

export function SettingsPage() {
  const { syncSettings, syncNow, updateSyncSettings, isSyncing } = useSync();
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncFeedback(null);
    const result = await syncNow();
    if (result) {
      const parts: string[] = [];
      if (result.added > 0) parts.push(`${result.added} new`);
      if (result.updated > 0) parts.push(`${result.updated} updated`);
      if (result.archived > 0) parts.push(`${result.archived} archived`);
      if (result.reopened > 0) parts.push(`${result.reopened} reopened`);
      parts.push(`${result.unchanged} unchanged`);
      setSyncFeedback(`Sync complete: ${result.checked} checked, ${parts.join(', ')}.`);
    } else {
      setSyncFeedback('Sync failed. See the error details below.');
    }
  };

  const handleIntervalChange = (value: SyncIntervalMinutes) => {
    updateSyncSettings({ syncInterval: value });
  };

  const handleAutoSyncToggle = () => {
    updateSyncSettings({ autoSync: !syncSettings.autoSync });
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* QMON API Section */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <CloudOff size={18} className="text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">QMON API</h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Configured Endpoint
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <code className="text-xs text-slate-600 break-all">{QMON_URL}</code>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              This endpoint is fixed and cannot be changed from the frontend. The QMON request
              is made from the local Node server, not the browser.
            </p>
          </div>
        </div>
      </section>

      {/* Automatic Sync Section */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Clock size={18} className="text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Automatic Sync</h3>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Auto sync toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Automatic Synchronization</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically poll QMON at the configured interval
              </p>
            </div>
            <button
              onClick={handleAutoSyncToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                syncSettings.autoSync ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  syncSettings.autoSync ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Sync interval selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Sync Interval
            </label>
            <select
              value={syncSettings.syncInterval}
              onChange={(e) => handleIntervalChange(Number(e.target.value) as SyncIntervalMinutes)}
              disabled={!syncSettings.autoSync}
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {SYNC_INTERVAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-400">
              The app will also sync automatically when you return after being away longer than the interval.
            </p>
          </div>
        </div>
      </section>

      {/* Manual Sync Section */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <RefreshCw size={18} className="text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Manual Sync</h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
          {syncFeedback && (
            <div
              className={`rounded-lg px-3 py-2.5 text-sm ${
                syncFeedback.startsWith('Sync complete')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {syncFeedback}
            </div>
          )}
        </div>
      </section>

      {/* Sync Information Section */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Info size={18} className="text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Sync Information</h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          <InfoRow
            label="Last successful sync"
            value={syncSettings.lastSuccessfulSync ? `${formatDateTime(syncSettings.lastSuccessfulSync)} (${relativeTime(syncSettings.lastSuccessfulSync)})` : 'Never'}
            icon={<CheckCircle2 size={14} className="text-emerald-600" />}
          />
          <InfoRow
            label="Last attempted sync"
            value={syncSettings.lastAttemptedSync ? `${formatDateTime(syncSettings.lastAttemptedSync)} (${relativeTime(syncSettings.lastAttemptedSync)})` : 'Never'}
          />
          {syncSettings.lastSyncSummary && (
            <>
              <div className="border-t border-slate-100 pt-3" />
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Tickets checked" value={String(syncSettings.lastSyncSummary.checked)} />
                <InfoRow label="Added" value={String(syncSettings.lastSyncSummary.added)} />
                <InfoRow label="Updated" value={String(syncSettings.lastSyncSummary.updated)} />
                <InfoRow label="Archived" value={String(syncSettings.lastSyncSummary.archived)} />
                <InfoRow label="Reopened" value={String(syncSettings.lastSyncSummary.reopened)} />
                <InfoRow label="Unchanged" value={String(syncSettings.lastSyncSummary.unchanged)} />
              </div>
            </>
          )}
          {syncSettings.lastError && (
            <>
              <div className="border-t border-slate-100 pt-3" />
              <InfoRow
                label="Last error"
                value={syncSettings.lastError}
                icon={<AlertCircle size={14} className="text-red-500" />}
                error
              />
            </>
          )}
        </div>
      </section>

      {/* Data Storage Section */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Database size={18} className="text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Data Storage</h3>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-600">
            All ticket data and personal workflow information is stored locally in your browser's
            localStorage. No cloud database is used. QMON synchronization updates official ticket
            information while preserving your personal organization.
          </p>
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
  error,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span
        className={`text-sm text-right break-words ${error ? 'text-red-600' : 'text-slate-700 font-medium'}`}
      >
        {icon && <span className="inline-flex items-center gap-1.5">{icon}{value}</span>}
        {!icon && value}
      </span>
    </div>
  );
}
