import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  pointerWithin,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Ticket, WorkQueue } from '@/types';
import { WORK_QUEUES } from '@/constants';
import { BoardColumn } from './BoardColumn';
import { TicketCard } from './TicketCard';
import { useTickets } from '@/context/TicketContext';

interface KanbanBoardProps {
  tickets: Ticket[];
  onOpenTicket: (id: string) => void;
  onQuickAction: (id: string, action: 'open' | 'update' | 'complete') => void;
}

export function KanbanBoard({ tickets, onOpenTicket, onQuickAction }: KanbanBoardProps) {
  const { moveTicket, reorderTicket } = useTickets();
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const ticketsByQueue = (queue: WorkQueue) =>
    tickets
      .filter((t) => t.workQueue === queue)
      .sort((a, b) => a.boardPosition - b.boardPosition);

  const handleDragStart = (e: DragStartEvent) => {
    const ticket = tickets.find((t) => t.id === e.active.id);
    setActiveTicket(ticket ?? null);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Dropping over a column (empty area)
    if (overId.startsWith('column-')) {
      const targetQueue = overId.replace('column-', '') as WorkQueue;
      const activeTicket = tickets.find((t) => t.id === activeId);
      if (activeTicket && activeTicket.workQueue !== targetQueue) {
        const targetTickets = ticketsByQueue(targetQueue);
        moveTicket(activeId, targetQueue, targetTickets.length);
      }
      return;
    }

    // Dropping over another ticket
    const activeTicket = tickets.find((t) => t.id === activeId);
    const overTicket = tickets.find((t) => t.id === overId);
    if (!activeTicket || !overTicket) return;

    if (activeTicket.workQueue !== overTicket.workQueue) {
      // Moving to a different queue, place at the over ticket's position
      moveTicket(activeId, overTicket.workQueue, overTicket.boardPosition);
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveTicket(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Dropping over a column
    if (overId.startsWith('column-')) {
      const targetQueue = overId.replace('column-', '') as WorkQueue;
      const activeTicket = tickets.find((t) => t.id === activeId);
      if (activeTicket && activeTicket.workQueue !== targetQueue) {
        const targetTickets = ticketsByQueue(targetQueue);
        moveTicket(activeId, targetQueue, targetTickets.length);
      }
      return;
    }

    // Dropping over another ticket in the same queue — reorder
    const activeTicket = tickets.find((t) => t.id === activeId);
    const overTicket = tickets.find((t) => t.id === overId);
    if (!activeTicket || !overTicket) return;

    if (activeTicket.workQueue === overTicket.workQueue && activeId !== overId) {
      const queueTickets = ticketsByQueue(activeTicket.workQueue);
      const oldIndex = queueTickets.findIndex((t) => t.id === activeId);
      const newIndex = queueTickets.findIndex((t) => t.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(queueTickets, oldIndex, newIndex);
        reordered.forEach((t, i) => {
          if (t.boardPosition !== i) reorderTicket(t.id, i);
        });
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {WORK_QUEUES.map((queue) => (
          <BoardColumn
            key={queue}
            queue={queue}
            tickets={ticketsByQueue(queue)}
            onOpenTicket={onOpenTicket}
            onQuickAction={onQuickAction}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTicket ? (
          <div className="w-72">
            <TicketCard
              ticket={activeTicket}
              onOpen={() => {}}
              onQuickAction={() => {}}
              isOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
