import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Building2,
  User,
  CalendarClock,
  AlertTriangle,
  MessageSquare,
  MoreVertical,
} from 'lucide-react';
import type { Ticket } from '@/types';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { followUpStatus, formatDate, relativeTime } from '@/utils';
import { QUEUE_STYLES } from '@/constants';

interface TicketCardProps {
  ticket: Ticket;
  onOpen: (id: string) => void;
  onQuickAction: (id: string, action: 'open' | 'update' | 'complete') => void;
  isOverlay?: boolean;
}

export function TicketCard({ ticket, onOpen, onQuickAction, isOverlay }: TicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id, data: { type: 'ticket', ticket } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fuStatus = followUpStatus(ticket.followUpDate);
  const queueStyle = QUEUE_STYLES[ticket.workQueue];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      } ${isOverlay ? 'shadow-xl rotate-3' : ''}`}
    >
      {/* Left accent bar for work queue */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${queueStyle.accent}`} />

      <div className="pl-3.5 pr-3 py-3">
        {/* Top row: ticket number + priority */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-medium text-slate-500">
            {ticket.ticketNumber}
          </span>
          <PriorityBadge priority={ticket.officialPriority} />
        </div>

        {/* Title */}
        <button
          onClick={() => onOpen(ticket.id)}
          className="mt-1.5 block w-full text-left"
        >
          <p className="text-sm font-semibold text-slate-900 leading-snug hover:text-slate-700 line-clamp-2">
            {ticket.title}
          </p>
        </button>

        {/* Company + contact */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Building2 size={12} className="shrink-0" />
            <span className="truncate">{ticket.company || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <User size={12} className="shrink-0" />
            <span className="truncate">{ticket.primaryContact || '—'}</span>
          </div>
        </div>

        {/* Tags */}
        {ticket.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {ticket.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600"
              >
                {tag}
              </span>
            ))}
            {ticket.tags.length > 3 && (
              <span className="text-xs text-slate-400">+{ticket.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer: follow-up + updated + source */}
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <div className="flex items-center gap-2 text-xs">
            {fuStatus === 'overdue' && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <AlertTriangle size={11} />
                {formatDate(ticket.followUpDate)}
              </span>
            )}
            {fuStatus === 'today' && (
              <span className="flex items-center gap-1 text-orange-600 font-medium">
                <CalendarClock size={11} />
                Today
              </span>
            )}
            {fuStatus === 'tomorrow' && (
              <span className="flex items-center gap-1 text-slate-500">
                <CalendarClock size={11} />
                Tomorrow
              </span>
            )}
            {fuStatus === 'upcoming' && (
              <span className="flex items-center gap-1 text-slate-500">
                <CalendarClock size={11} />
                {formatDate(ticket.followUpDate)}
              </span>
            )}
            {fuStatus === 'none' && (
              <span className="text-slate-400">{ticket.source}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {ticket.updates.length > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageSquare size={11} />
                {ticket.updates.length}
              </span>
            )}
            <span>{relativeTime(ticket.updatedAt)}</span>
          </div>
        </div>

        {/* Quick actions (visible on hover) */}
        <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction(ticket.id, 'open');
            }}
            className="flex-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Open
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction(ticket.id, 'update');
            }}
            className="flex-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Update
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction(ticket.id, 'complete');
            }}
            className="flex-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}
