import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Ticket, WorkQueue } from '@/types';
import { TicketCard } from './TicketCard';
import { QUEUE_STYLES } from '@/constants';

interface BoardColumnProps {
  queue: WorkQueue;
  tickets: Ticket[];
  onOpenTicket: (id: string) => void;
  onQuickAction: (id: string, action: 'open' | 'update' | 'complete') => void;
}

export function BoardColumn({ queue, tickets, onOpenTicket, onQuickAction }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${queue}`,
    data: { type: 'column', queue },
  });

  const style = QUEUE_STYLES[queue];

  return (
    <div className="flex w-72 shrink-0 flex-col">
      {/* Column header */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className={`h-3 w-3 rounded-sm border-l-4 ${style.accent} border border-slate-200`} />
        <h3 className={`text-sm font-semibold ${style.header}`}>{queue}</h3>
        <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {tickets.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg p-2 transition-colors ${style.column} ${
          isOver ? 'ring-2 ring-slate-400 ring-inset' : ''
        }`}
        style={{ minHeight: '200px' }}
      >
        <SortableContext
          items={tickets.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tickets.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-xs text-slate-400 text-center px-4">
                  No tickets in {queue}
                </p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onOpen={onOpenTicket}
                  onQuickAction={onQuickAction}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
