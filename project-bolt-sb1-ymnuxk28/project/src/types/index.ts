export type OfficialPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type WorkQueue =
  | 'Focus on Now'
  | 'Next Up'
  | 'When You Have Time'
  | 'Back Burner'
  | 'Pending Customer'
  | 'Pending Development';

export type TicketSource = string;

export type ArchiveReason = 'qmon_closed' | 'manually_archived' | 'completed';

export interface TicketUpdate {
  id: string;
  text: string;
  createdAt: string;
  isSystem?: boolean;
}

export interface QmonFields {
  feedTimestamp: string | null;
  product: string;
  owner: string;
  source: string;
  age: string;
  lastUpdated: string | null;
  officialStatus: string;
  assignedEngineer: string;
  phone: string;
  email: string;
  region: string;
  country: string;
  compliance: string;
  ticketUrl: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  primaryContact: string;
  company: string;
  source: TicketSource;
  officialPriority: OfficialPriority;
  workQueue: WorkQueue;
  boardPosition: number;
  tags: string[];
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  resolution: string | null;
  updates: TicketUpdate[];
  archived: boolean;
  archiveReason: ArchiveReason | null;
  // QMON-controlled fields
  qmon: QmonFields | null;
  // Legacy case reference
  legacyCaseNumber: string | null;
}

export type ViewName = 'dashboard' | 'active' | 'archive' | 'settings';

export type SyncIntervalMinutes = 1 | 5 | 10 | 15 | 30 | 60 | 0;

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: SyncIntervalMinutes;
  lastSuccessfulSync: string | null;
  lastAttemptedSync: string | null;
  lastError: string | null;
  lastSyncSummary: SyncSummary | null;
}

export interface SyncSummary {
  checked: number;
  added: number;
  updated: number;
  archived: number;
  reopened: number;
  unchanged: number;
  timestamp: string;
}

export interface AppSettings {
  ticketSources: TicketSource[];
  sync: SyncSettings;
}
