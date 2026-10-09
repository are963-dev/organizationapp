import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Ticket, TicketUpdate, WorkQueue, AppSettings, OfficialPriority, ArchiveReason } from '@/types';
import { DEFAULT_TICKET_SOURCES, STORAGE_KEY, SETTINGS_KEY, DEFAULT_APP_SETTINGS } from '@/constants';
import { uid, nowISO } from '@/utils';
import { createSeedTickets } from '@/data/seedData';

interface TicketContextValue {
  tickets: Ticket[];
  activeTickets: Ticket[];
  archivedTickets: Ticket[];
  settings: AppSettings;
  addTicket: (data: Partial<Ticket>) => Ticket;
  updateTicket: (id: string, data: Partial<Ticket>) => void;
  deleteTicket: (id: string) => void;
  addUpdate: (id: string, text: string) => void;
  completeTicket: (id: string, resolution: string) => void;
  restoreTicket: (id: string) => void;
  moveTicket: (id: string, workQueue: WorkQueue, boardPosition: number) => void;
  reorderTicket: (id: string, boardPosition: number) => void;
  updateSettings: (data: Partial<AppSettings>) => void;
  setTickets: (tickets: Ticket[]) => void;
  archiveTicket: (id: string, reason: ArchiveReason) => void;
  clearSeedData: () => void;
}

const TicketContext = createContext<TicketContextValue | null>(null);

// Migrate old tickets (pre-QMON) to include new fields
function migrateTickets(raw: Ticket[]): Ticket[] {
  return raw.map((t) => ({
    ...t,
    archiveReason: t.archiveReason ?? (t.archived ? 'completed' : null),
    qmon: t.qmon ?? null,
    legacyCaseNumber: t.legacyCaseNumber ?? null,
    updates: t.updates.map((u) => ({ ...u, isSystem: u.isSystem ?? false })),
  }));
}

function loadTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateTickets(JSON.parse(raw) as Ticket[]);
  } catch {
    // ignore
  }
return [];
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return {
        ticketSources: parsed.ticketSources ?? DEFAULT_TICKET_SOURCES,
        sync: parsed.sync ?? DEFAULT_APP_SETTINGS.sync,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_APP_SETTINGS;
}

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTicketsState] = useState<Ticket[]>(loadTickets);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const setTickets = (newTickets: Ticket[]) => setTicketsState(newTickets);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch {
      // ignore
    }
  }, [tickets]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const value = useMemo<TicketContextValue>(() => {
    const maxBoardPosition = (queue: WorkQueue): number => {
      const inQueue = tickets.filter((t) => t.workQueue === queue && !t.archived);
      return inQueue.reduce((max, t) => Math.max(max, t.boardPosition), -1);
    };

    return {
      tickets,
      activeTickets: tickets.filter((t) => !t.archived),
      archivedTickets: tickets
        .filter((t) => t.archived)
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
      settings,
      setTickets,
      addTicket: (data) => {
        const queue = data.workQueue ?? 'When You Have Time';
        const pos = maxBoardPosition(queue) + 1;
        const ticket: Ticket = {
          id: uid(),
          ticketNumber: data.ticketNumber ?? '',
          title: data.title ?? '',
          description: data.description ?? '',
          primaryContact: data.primaryContact ?? '',
          company: data.company ?? '',
          source: data.source ?? settings.ticketSources[0] ?? 'Salesforce',
          officialPriority: data.officialPriority ?? 'Medium',
          workQueue: queue,
          boardPosition: pos,
          tags: data.tags ?? [],
          followUpDate: data.followUpDate ?? null,
          createdAt: nowISO(),
          updatedAt: nowISO(),
          completedAt: null,
          resolution: null,
          updates: [],
          archived: false,
          archiveReason: null,
          qmon: data.qmon ?? null,
          legacyCaseNumber: data.legacyCaseNumber ?? null,
        };
        setTicketsState((prev) => [...prev, ticket]);
        return ticket;
      },
      updateTicket: (id, data) => {
        setTicketsState((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: nowISO() } : t
          )
        );
      },
      deleteTicket: (id) => {
        setTicketsState((prev) => prev.filter((t) => t.id !== id));
      },
      addUpdate: (id, text) => {
        const update: TicketUpdate = { id: uid(), text, createdAt: nowISO() };
        setTicketsState((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, updates: [...t.updates, update], updatedAt: nowISO() }
              : t
          )
        );
      },
      completeTicket: (id, resolution) => {
        setTicketsState((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, archived: true, archiveReason: 'completed', completedAt: nowISO(), resolution, updatedAt: nowISO() }
              : t
          )
        );
      },
      archiveTicket: (id, reason) => {
        setTicketsState((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, archived: true, archiveReason: reason, updatedAt: nowISO() }
              : t
          )
        );
      },
      restoreTicket: (id) => {
        setTicketsState((prev) =>
          prev.map((t) => {
            if (t.id !== id) return t;
            const pos = maxBoardPosition(t.workQueue) + 1;
            return { ...t, archived: false, archiveReason: null, completedAt: null, resolution: null, boardPosition: pos, updatedAt: nowISO() };
          })
        );
      },
      moveTicket: (id, workQueue, boardPosition) => {
        setTicketsState((prev) => {
          const ticket = prev.find((t) => t.id === id);
          if (!ticket) return prev;
          const sameQueue = ticket.workQueue === workQueue;
          const others = prev.filter((t) =>
            t.id !== id && !t.archived && t.workQueue === (sameQueue ? workQueue : t.workQueue)
          );

          if (sameQueue) {
            const reordered = others
              .sort((a, b) => a.boardPosition - b.boardPosition)
              .map((t, i) => ({ ...t, boardPosition: i < boardPosition ? i : i + 1 }));
            return prev.map((t) => {
              if (t.id === id) return { ...t, boardPosition, updatedAt: nowISO() };
              const r = reordered.find((r) => r.id === t.id);
              return r ?? t;
            });
          }

          // Moving to a different queue — remove from old, insert into new
          const oldQueueTickets = prev
            .filter((t) => t.id !== id && !t.archived && t.workQueue === ticket.workQueue)
            .sort((a, b) => a.boardPosition - b.boardPosition)
            .map((t, i) => ({ ...t, boardPosition: i }));

          const newQueueTickets = prev
            .filter((t) => t.id !== id && !t.archived && t.workQueue === workQueue)
            .sort((a, b) => a.boardPosition - b.boardPosition)
            .map((t, i) => ({ ...t, boardPosition: i < boardPosition ? i : i + 1 }));

          return prev.map((t) => {
            if (t.id === id) return { ...t, workQueue, boardPosition, updatedAt: nowISO() };
            const o = oldQueueTickets.find((r) => r.id === t.id);
            if (o) return o;
            const n = newQueueTickets.find((r) => r.id === t.id);
            if (n) return n;
            return t;
          });
        });
      },
      reorderTicket: (id, boardPosition) => {
        setTicketsState((prev) => {
          const ticket = prev.find((t) => t.id === id);
          if (!ticket) return prev;
          const queue = ticket.workQueue;
          const others = prev
            .filter((t) => t.id !== id && !t.archived && t.workQueue === queue)
            .sort((a, b) => a.boardPosition - b.boardPosition)
            .map((t, i) => ({ ...t, boardPosition: i < boardPosition ? i : i + 1 }));
          return prev.map((t) => {
            if (t.id === id) return { ...t, boardPosition, updatedAt: nowISO() };
            const r = others.find((r) => r.id === t.id);
            return r ?? t;
          });
        });
      },
      updateSettings: (data) => {
        setSettings((prev) => ({ ...prev, ...data }));
      },
      clearSeedData: () => {
        setTicketsState([]);
      },
    };
  }, [tickets, settings]);

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
}

export function useTickets(): TicketContextValue {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error('useTickets must be used within TicketProvider');
  return ctx;
}

export type { OfficialPriority };
