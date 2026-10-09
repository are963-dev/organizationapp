import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { SyncSettings, SyncSummary, SyncIntervalMinutes } from '@/types';
import { SYNC_SETTINGS_KEY, DEFAULT_SYNC_INTERVAL } from '@/constants';
import { nowISO } from '@/utils';
import { syncTickets } from '@/utils/qmonSync';
import { useTickets } from '@/context/TicketContext';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'never';

interface SyncContextValue {
  syncSettings: SyncSettings;
  syncStatus: SyncStatus;
  syncNow: () => Promise<SyncSummary | null>;
  updateSyncSettings: (data: Partial<SyncSettings>) => void;
  isSyncing: boolean;
}

const SyncContext = createContext<SyncContextValue | null>(null);

function loadSyncSettings(): SyncSettings {
  try {
    const raw = localStorage.getItem(SYNC_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SyncSettings>;
      return {
        autoSync: parsed.autoSync ?? true,
        syncInterval: parsed.syncInterval ?? DEFAULT_SYNC_INTERVAL,
        lastSuccessfulSync: parsed.lastSuccessfulSync ?? null,
        lastAttemptedSync: parsed.lastAttemptedSync ?? null,
        lastError: parsed.lastError ?? null,
        lastSyncSummary: parsed.lastSyncSummary ?? null,
      };
    }
  } catch {
    // ignore
  }
  return {
    autoSync: true,
    syncInterval: DEFAULT_SYNC_INTERVAL,
    lastSuccessfulSync: null,
    lastAttemptedSync: null,
    lastError: null,
    lastSyncSummary: null,
  };
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { tickets, setTickets } = useTickets();
  const [syncSettings, setSyncSettings] = useState<SyncSettings>(loadSyncSettings);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(syncSettings));
    } catch {
      // ignore
    }
  }, [syncSettings]);

  const updateSyncSettings = useCallback((data: Partial<SyncSettings>) => {
    setSyncSettings((prev) => ({ ...prev, ...data }));
  }, []);

  const syncNow = useCallback(async (): Promise<SyncSummary | null> => {
    if (syncingRef.current) return null;
    syncingRef.current = true;
    setIsSyncing(true);

    setSyncSettings((prev) => ({ ...prev, lastAttemptedSync: nowISO() }));

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const body = errorText.trim();

        // The local Node server (server.cjs) never returns 500 for /api/sync.
        // A 5xx with an empty/short body typically means the request was answered
        // by a dev proxy or hosted preview, not by the Node server.
        if (response.status >= 500) {
          console.error(
            `[sync] /api/sync returned HTTP ${response.status}. ` +
              'This usually means the request did not reach server.cjs. ' +
              'Start the app with "Start Support Command Center.bat" (or run the Node server) and open http://localhost:3001.'
          );
          setSyncSettings((prev) => ({
            ...prev,
            lastError: `Server error: ${response.status}${
              body ? ' ' + body : ''
            }. The local sync server may not be running — start the app with "Start Support Command Center.bat" and open http://localhost:3001.`,
          }));
        } else if (response.status === 404) {
          setSyncSettings((prev) => ({
            ...prev,
            lastError: 'The sync endpoint was not found. Make sure server.cjs is the server answering /api/sync (start via Start Support Command Center.bat).',
          }));
        } else {
          setSyncSettings((prev) => ({
            ...prev,
            lastError: `Server error: ${response.status}${body ? ' ' + body : ''}`,
          }));
        }
        return null;
      }

      const data = await response.json();
      if (!data.success || typeof data.qmonResponse !== 'string') {
        setSyncSettings((prev) => ({
          ...prev,
          lastError: data.error || 'Invalid response from server',
        }));
        return null;
      }

      const result = syncTickets(tickets, data.qmonResponse);
      if (!result.success) {
        setSyncSettings((prev) => ({
          ...prev,
          lastError: result.error,
        }));
        return null;
      }

      setTickets(result.tickets);

      const summary = result.summary;
      setSyncSettings((prev) => ({
        ...prev,
        lastSuccessfulSync: nowISO(),
        lastError: null,
        lastSyncSummary: summary,
      }));

      return summary;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setSyncSettings((prev) => ({
        ...prev,
        lastError: `Unable to reach local server: ${message}`,
      }));
      return null;
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [tickets, setTickets]);

  // Automatic polling
  useEffect(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    const intervalMinutes = syncSettings.syncInterval;
    if (!syncSettings.autoSync || intervalMinutes === 0) return;

    const intervalMs = intervalMinutes * 60 * 1000;
    pollTimerRef.current = setInterval(() => {
      if (!syncingRef.current) {
        syncNow();
      }
    }, intervalMs);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [syncSettings.autoSync, syncSettings.syncInterval, syncNow]);

  // Sync when returning to the app after inactivity
  useEffect(() => {
    let lastVisible = document.visibilityState === 'visible';
    let hiddenAt: number | null = null;

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      if (!isVisible && lastVisible) {
        hiddenAt = Date.now();
      } else if (isVisible && !lastVisible && hiddenAt !== null) {
        const hiddenMs = Date.now() - hiddenAt;
        const intervalMs = (syncSettings.syncInterval || DEFAULT_SYNC_INTERVAL) * 60 * 1000;

        // If hidden longer than the interval, and last sync is older than the interval
        if (hiddenMs >= intervalMs && syncSettings.syncInterval > 0) {
          const lastSync = syncSettings.lastSuccessfulSync;
          if (lastSync) {
            const syncAge = Date.now() - new Date(lastSync).getTime();
            if (syncAge >= intervalMs && !syncingRef.current) {
              syncNow();
            }
          } else if (!syncingRef.current) {
            syncNow();
          }
        }
        hiddenAt = null;
      }
      lastVisible = isVisible;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncSettings.syncInterval, syncSettings.lastSuccessfulSync, syncNow]);

  const syncStatus: SyncStatus = isSyncing
    ? 'syncing'
    : syncSettings.lastError
    ? 'error'
    : syncSettings.lastSuccessfulSync
    ? 'synced'
    : 'never';

  return (
    <SyncContext.Provider value={{ syncSettings, syncStatus, syncNow, updateSyncSettings, isSyncing }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
