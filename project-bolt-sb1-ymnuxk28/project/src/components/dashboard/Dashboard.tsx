import {
  Flame,
  ArrowRight,
  Clock,
  MessageSquareMore,
  Code2,
  CheckCircle2,
  CalendarClock,
  AlertTriangle,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { useTickets } from '@/context/TicketContext';
import { SummaryCard } from './SummaryCard';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { followUpStatus, formatDate, relativeTime } from '@/utils';
import type { WorkQueue } from '@/types';
import type { ViewName } from '@/types';

interface DashboardProps {
  onNavigate: (view: ViewName) => void;
  onOpenTicket: (id: string) => void;
}

const QUEUE_ORDER: WorkQueue[] = [
  'Focus on Now',
  'Next Up',
  'When You Have Time',
  'Back Burner',
  'Pending Customer',
  'Pending Development',
];

const QUEUE_ICONS: Record<WorkQueue, typeof Flame> = {
  'Focus on Now': Flame,
  'Next Up': ArrowRight,
  'When You Have Time': Clock,
  'Back Burner': Inbox,
  'Pending Customer': MessageSquareMore,
  'Pending Development': Code2,
};

const QUEUE_ICON_COLORS: Record<WorkQueue, string> = {
  'Focus on Now': 'bg-red-100 text-red-600',
  'Next Up': 'bg-orange-100 text-orange-600',
  'When You Have Time': 'bg-amber-100 text-amber-600',
  'Back Burner': 'bg-gray-100 text-gray-500',
  'Pending Customer': 'bg-sky-100 text-sky-600',
  'Pending Development': 'bg-indigo-100 text-indigo-600',
};

export function Dashboard({ onNavigate, onOpenTicket }: DashboardProps) {
  const { activeTickets, archivedTickets } = useTickets();

  const countByQueue = (q: WorkQueue) =>
    activeTickets.filter((t) => t.workQueue === q).length;

  const completedToday = archivedTickets.filter((t) => {
    if (!t.completedAt) return false;
    const d = new Date(t.completedAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const focusTickets = activeTickets
    .filter((t) => t.workQueue === 'Focus on Now')
    .sort((a, b) => a.boardPosition - b.boardPosition);
  const nextUpTickets = activeTickets
    .filter((t) => t.workQueue === 'Next Up')
    .sort((a, b) => a.boardPosition - b.boardPosition);
  const pendingTickets = activeTickets
    .filter(
      (t) => t.workQueue === 'Pending Customer' || t.workQueue === 'Pending Development'
    )
    .sort((a, b) => a.boardPosition - b.boardPosition);

  const upcomingFollowUps = activeTickets
    .filter((t) => t.followUpDate)
    .map((t) => ({ ticket: t, status: followUpStatus(t.followUpDate) }))
    .filter((x) => x.status !== 'none')
    .sort((a, b) => (a.ticket.followUpDate ?? '').localeCompare(b.ticket.followUpDate ?? ''));

  const renderTicketRow = (ticket: (typeof activeTickets)[number]) => (
    <button
      key={ticket.id}
      onClick={() => onOpenTicket(ticket.id)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-500">{ticket.ticketNumber}</span>
          <PriorityBadge priority={ticket.officialPriority} />
        </div>
        <p className="mt-0.5 truncate text-sm font-medium text-slate-800">{ticket.title}</p>
        <p className="truncate text-xs text-slate-500">
          {ticket.company} · {ticket.primaryContact}
        </p>
      </div>
      <ChevronRight size={16} className="text-slate-300 shrink-0" />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard
          label="Focus on Now"
          count={countByQueue('Focus on Now')}
          icon={<Flame size={20} className="text-red-600" />}
          accent="border-l-4 border-l-red-500"
          iconBg="bg-red-50"
          onClick={() => onNavigate('active')}
        />
        <SummaryCard
          label="Next Up"
          count={countByQueue('Next Up')}
          icon={<ArrowRight size={20} className="text-orange-600" />}
          accent="border-l-4 border-l-orange-500"
          iconBg="bg-orange-50"
          onClick={() => onNavigate('active')}
        />
        <SummaryCard
          label="When You Have Time"
          count={countByQueue('When You Have Time')}
          icon={<Clock size={20} className="text-amber-600" />}
          accent="border-l-4 border-l-amber-400"
          iconBg="bg-amber-50"
          onClick={() => onNavigate('active')}
        />
        <SummaryCard
          label="Pending Customer"
          count={countByQueue('Pending Customer')}
          icon={<MessageSquareMore size={20} className="text-sky-600" />}
          accent="border-l-4 border-l-sky-500"
          iconBg="bg-sky-50"
          onClick={() => onNavigate('active')}
        />
        <SummaryCard
          label="Pending Development"
          count={countByQueue('Pending Development')}
          icon={<Code2 size={20} className="text-indigo-600" />}
          accent="border-l-4 border-l-indigo-500"
          iconBg="bg-indigo-50"
          onClick={() => onNavigate('active')}
        />
        <SummaryCard
          label="Completed Today"
          count={completedToday}
          icon={<CheckCircle2 size={20} className="text-emerald-600" />}
          accent="border-l-4 border-l-emerald-500"
          iconBg="bg-emerald-50"
          onClick={() => onNavigate('archive')}
        />
      </div>

      {/* Priority overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Focus on Now */}
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <Flame size={18} className="text-red-600" />
            <h3 className="text-sm font-semibold text-slate-900">Focus on Now</h3>
            <span className="ml-auto rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
              {focusTickets.length}
            </span>
          </div>
          <div className="py-1">
            {focusTickets.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-400 text-center">
                No tickets in Focus on Now
              </p>
            ) : (
              focusTickets.map(renderTicketRow)
            )}
          </div>
        </section>

        {/* Next Up */}
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <ArrowRight size={18} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-slate-900">Next Up</h3>
            <span className="ml-auto rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
              {nextUpTickets.length}
            </span>
          </div>
          <div className="py-1">
            {nextUpTickets.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-400 text-center">
                No tickets in Next Up
              </p>
            ) : (
              nextUpTickets.map(renderTicketRow)
            )}
          </div>
        </section>

        {/* Waiting / Pending */}
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <Clock size={18} className="text-sky-600" />
            <h3 className="text-sm font-semibold text-slate-900">Waiting / Pending</h3>
            <span className="ml-auto rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-600">
              {pendingTickets.length}
            </span>
          </div>
          <div className="py-1">
            {pendingTickets.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-400 text-center">
                No pending tickets
              </p>
            ) : (
              pendingTickets.map(renderTicketRow)
            )}
          </div>
        </section>
      </div>

      {/* Work Queue overview + Follow-ups */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Work queue overview */}
        <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Work Queue Overview</h3>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-3">
            {QUEUE_ORDER.map((q) => {
              const Icon = QUEUE_ICONS[q];
              const count = countByQueue(q);
              return (
                <button
                  key={q}
                  onClick={() => onNavigate('active')}
                  className="flex items-center gap-3 bg-white px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${QUEUE_ICON_COLORS[q]}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 leading-none">{count}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{q}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Upcoming follow-ups */}
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <CalendarClock size={18} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Upcoming Follow-ups</h3>
          </div>
          <div className="py-1 max-h-80 overflow-y-auto">
            {upcomingFollowUps.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-400 text-center">
                No upcoming follow-ups
              </p>
            ) : (
              upcomingFollowUps.map(({ ticket, status }) => (
                <button
                  key={ticket.id}
                  onClick={() => onOpenTicket(ticket.id)}
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="mt-0.5">
                    {status === 'overdue' ? (
                      <AlertTriangle size={16} className="text-red-500" />
                    ) : (
                      <CalendarClock size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {ticket.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-slate-500">
                        {ticket.ticketNumber}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          status === 'overdue'
                            ? 'text-red-600'
                            : status === 'today'
                            ? 'text-orange-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {status === 'overdue'
                          ? `Overdue · ${formatDate(ticket.followUpDate)}`
                          : status === 'today'
                          ? 'Today'
                          : formatDate(ticket.followUpDate)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Recently updated */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Recently Updated</h3>
        </div>
        <div className="py-1">
          {activeTickets.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400 text-center">
              No active tickets
            </p>
          ) : (
            [...activeTickets]
              .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
              .slice(0, 5)
              .map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => onOpenTicket(ticket.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">{ticket.ticketNumber}</span>
                      <PriorityBadge priority={ticket.officialPriority} />
                      <span className="text-xs text-slate-400">
                        {ticket.workQueue}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium text-slate-800">
                      {ticket.title}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {relativeTime(ticket.updatedAt)}
                  </span>
                </button>
              ))
          )}
        </div>
      </section>
    </div>
  );
}
