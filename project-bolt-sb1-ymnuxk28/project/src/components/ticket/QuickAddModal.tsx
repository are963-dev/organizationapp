import { useState } from 'react';
import { Zap } from 'lucide-react';
import { Modal, Field, inputClass } from '@/components/ui/Modal';
import { OFFICIAL_PRIORITIES, WORK_QUEUES } from '@/constants';
import { useTickets } from '@/context/TicketContext';
import type { OfficialPriority, WorkQueue } from '@/types';

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function QuickAddModal({ open, onClose, onCreated }: QuickAddModalProps) {
  const { addTicket, settings } = useTickets();

  const [ticketNumber, setTicketNumber] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState(settings.ticketSources[0] ?? '');
  const [officialPriority, setOfficialPriority] = useState<OfficialPriority>('Medium');
  const [workQueue, setWorkQueue] = useState<WorkQueue>('When You Have Time');

  const reset = () => {
    setTicketNumber('');
    setTitle('');
    setCompany('');
    setSource(settings.ticketSources[0] ?? '');
    setOfficialPriority('Medium');
    setWorkQueue('When You Have Time');
  };

  const handleSubmit = () => {
    if (!ticketNumber.trim() || !title.trim()) return;
    const ticket = addTicket({
      ticketNumber: ticketNumber.trim(),
      title: title.trim(),
      company: company.trim(),
      source,
      officialPriority,
      workQueue,
    });
    reset();
    onClose();
    onCreated(ticket.id);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Quick Add Ticket"
      subtitle="Capture the essentials — fill in details later"
      footer={
        <>
          <button
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!ticketNumber.trim() || !title.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap size={15} />
            Quick Create
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ticket Number *">
            <input
              className={inputClass}
              value={ticketNumber}
              placeholder="TS1-1234"
              onChange={(e) => setTicketNumber(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Title *">
            <input
              className={inputClass}
              value={title}
              placeholder="Brief issue description"
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Company">
            <input
              className={inputClass}
              value={company}
              placeholder="Customer company"
              onChange={(e) => setCompany(e.target.value)}
            />
          </Field>
          <Field label="Ticket Source">
            <select
              className={inputClass}
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {settings.ticketSources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Official Priority">
            <select
              className={inputClass}
              value={officialPriority}
              onChange={(e) => setOfficialPriority(e.target.value as OfficialPriority)}
            >
              {OFFICIAL_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="My Work Queue">
            <select
              className={inputClass}
              value={workQueue}
              onChange={(e) => setWorkQueue(e.target.value as WorkQueue)}
            >
              {WORK_QUEUES.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </Field>
        </div>
        <p className="text-xs text-slate-400">
          You can add description, contact, follow-up date, tags, and updates later from the ticket detail view.
        </p>
      </div>
    </Modal>
  );
}
