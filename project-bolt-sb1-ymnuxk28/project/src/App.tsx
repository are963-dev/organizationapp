import { useState, useMemo, useEffect } from 'react';
import { TicketProvider, useTickets } from '@/context/TicketContext';
import { SyncProvider } from '@/context/SyncContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { FilterBar, type FilterState } from '@/components/board/FilterBar';
import { ArchivePage } from '@/components/archive/ArchivePage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { TicketDetail } from '@/components/ticket/TicketDetail';
import { AddTicketModal } from '@/components/ticket/AddTicketModal';
import { QuickAddModal } from '@/components/ticket/QuickAddModal';
import type { ViewName } from '@/types';
import { followUpStatus } from '@/utils';

function AppContent() {
  const { activeTickets, archivedTickets, completeTicket } = useTickets();

  const [view, setView] = useState<ViewName>('dashboard');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    workQueue: 'all',
    officialPriority: 'all',
    source: 'all',
    company: 'all',
    followUp: 'all',
  });
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Listen for legacy case navigation events from TicketDetail
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') {
        setOpenTicketId(detail);
      }
    };
    window.addEventListener('open-ticket', handler);
    return () => window.removeEventListener('open-ticket', handler);
  }, []);

  const openTicket = useMemo(
    () =>
      [...activeTickets, ...archivedTickets].find((t) => t.id === openTicketId) ?? null,
    [activeTickets, archivedTickets, openTicketId]
  );

  // Global search across all active tickets
  const searchMatches = (ticket: typeof activeTickets[number]): boolean => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      ticket.ticketNumber.toLowerCase().includes(q) ||
      ticket.title.toLowerCase().includes(q) ||
      ticket.description.toLowerCase().includes(q) ||
      ticket.company.toLowerCase().includes(q) ||
      ticket.primaryContact.toLowerCase().includes(q) ||
      ticket.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      ticket.updates.some((u) => u.text.toLowerCase().includes(q))
    );
  };

  const filterMatches = (ticket: typeof activeTickets[number]): boolean => {
    if (filters.workQueue !== 'all' && ticket.workQueue !== filters.workQueue) return false;
    if (filters.officialPriority !== 'all' && ticket.officialPriority !== filters.officialPriority) return false;
    if (filters.source !== 'all' && ticket.source !== filters.source) return false;
    if (filters.company !== 'all' && ticket.company !== filters.company) return false;
    if (filters.followUp !== 'all') {
      const status = followUpStatus(ticket.followUpDate);
      if (filters.followUp === 'overdue' && status !== 'overdue') return false;
      if (filters.followUp === 'upcoming' && status === 'none') return false;
      if (filters.followUp === 'none' && status !== 'none') return false;
    }
    return true;
  };

  const filteredActiveTickets = useMemo(
    () => activeTickets.filter((t) => searchMatches(t) && filterMatches(t)),
    [activeTickets, search, filters]
  );

  const handleQuickAction = (id: string, action: 'open' | 'update' | 'complete') => {
    if (action === 'open') {
      setOpenTicketId(id);
    } else if (action === 'update') {
      setOpenTicketId(id);
    } else if (action === 'complete') {
      setOpenTicketId(id);
    }
  };

  const handleComplete = (id: string) => {
    completeTicket(id, '');
  };

  const titles: Record<ViewName, string> = {
    dashboard: 'Dashboard',
    active: 'Active Tickets',
    archive: 'Archive',
    settings: 'Settings',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        currentView={view}
        onNavigate={setView}
        counts={{ active: activeTickets.length, archive: archivedTickets.length }}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          search={search}
          onSearchChange={setSearch}
          onAddTicket={() => setShowAdd(true)}
          onQuickAdd={() => setShowQuickAdd(true)}
          title={titles[view]}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {view === 'dashboard' && (
            <Dashboard
              onNavigate={setView}
              onOpenTicket={setOpenTicketId}
            />
          )}

          {view === 'active' && (
            <div className="space-y-4">
              <FilterBar filters={filters} onFiltersChange={setFilters} />
              <KanbanBoard
                tickets={filteredActiveTickets}
                onOpenTicket={setOpenTicketId}
                onQuickAction={handleQuickAction}
              />
            </div>
          )}

          {view === 'archive' && <ArchivePage onOpenTicket={setOpenTicketId} />}

          {view === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Modals & Drawers */}
      <TicketDetail
        ticket={openTicket}
        onClose={() => setOpenTicketId(null)}
        onComplete={handleComplete}
      />
      <AddTicketModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={(id) => setOpenTicketId(id)}
      />
      <QuickAddModal
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onCreated={(id) => setOpenTicketId(id)}
      />
    </div>
  );
}

export default function App() {
  return (
    <TicketProvider>
      <SyncProvider>
        <AppContent />
      </SyncProvider>
    </TicketProvider>
  );
}
