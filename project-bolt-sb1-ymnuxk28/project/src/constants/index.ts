import type { OfficialPriority, WorkQueue, SyncIntervalMinutes, AppSettings } from '@/types';

export const OFFICIAL_PRIORITIES: OfficialPriority[] = [
  'Critical',
  'High',
  'Medium',
  'Low',
];

export const WORK_QUEUES: WorkQueue[] = [
  'Focus on Now',
  'Next Up',
  'When You Have Time',
  'Back Burner',
  'Pending Customer',
  'Pending Development',
];

export const PRIORITY_STYLES: Record<
  OfficialPriority,
  { dot: string; badge: string; label: string; text: string }
> = {
  Critical: {
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    label: 'Critical',
    text: 'text-red-700',
  },
  High: {
    dot: 'bg-orange-500',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    label: 'High',
    text: 'text-orange-700',
  },
  Medium: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Medium',
    text: 'text-amber-700',
  },
  Low: {
    dot: 'bg-gray-300',
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    label: 'Low',
    text: 'text-gray-600',
  },
};

export const QUEUE_STYLES: Record<
  WorkQueue,
  { accent: string; header: string; column: string; icon: string }
> = {
  'Focus on Now': {
    accent: 'border-l-red-500',
    header: 'text-red-700',
    column: 'bg-red-50/40',
    icon: 'text-red-600',
  },
  'Next Up': {
    accent: 'border-l-orange-500',
    header: 'text-orange-700',
    column: 'bg-orange-50/40',
    icon: 'text-orange-600',
  },
  'When You Have Time': {
    accent: 'border-l-amber-400',
    header: 'text-amber-700',
    column: 'bg-amber-50/30',
    icon: 'text-amber-600',
  },
  'Back Burner': {
    accent: 'border-l-gray-400',
    header: 'text-gray-600',
    column: 'bg-gray-50/40',
    icon: 'text-gray-500',
  },
  'Pending Customer': {
    accent: 'border-l-sky-500',
    header: 'text-sky-700',
    column: 'bg-sky-50/40',
    icon: 'text-sky-600',
  },
  'Pending Development': {
    accent: 'border-l-indigo-500',
    header: 'text-indigo-700',
    column: 'bg-indigo-50/40',
    icon: 'text-indigo-600',
  },
};

export const DEFAULT_TICKET_SOURCES = ['Salesforce', 'SMAX', 'Ticket System 1', 'Ticket System 2'];

export const STORAGE_KEY = 'ticket-command-center-v1';

export const SETTINGS_KEY = 'ticket-command-center-settings-v1';

export const SYNC_SETTINGS_KEY = 'ticket-command-center-sync-v1';

export const QMON_URL = 'http://phoenix.dnsdhcp.provo.novell.com/qmon/open.php?tse=Alex%20Evans';

export const SYNC_INTERVAL_OPTIONS: { value: SyncIntervalMinutes; label: string }[] = [
  { value: 1, label: '1 minute' },
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 0, label: 'Off' },
];

export const DEFAULT_SYNC_INTERVAL: SyncIntervalMinutes = 5;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  ticketSources: DEFAULT_TICKET_SOURCES,
  sync: {
    autoSync: true,
    syncInterval: DEFAULT_SYNC_INTERVAL,
    lastSuccessfulSync: null,
    lastAttemptedSync: null,
    lastError: null,
    lastSyncSummary: null,
  },
};

// QMON statuses considered "closed" — tickets with these statuses get archived
export const QMON_CLOSED_STATUSES = ['Closed', 'Resolved', 'Cancelled', 'Duplicate'];

// Map QMON priority strings to our OfficialPriority type
export function normalizeQmonPriority(raw: string): OfficialPriority {
  const lower = raw.toLowerCase().trim();
  if (lower === 'critical') return 'Critical';
  if (lower === 'high') return 'High';
  if (lower === 'medium') return 'Medium';
  if (lower === 'low') return 'Low';
  return 'Medium';
}
