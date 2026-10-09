import { useState } from 'react';
import { Modal, Field, inputClass } from '@/components/ui/Modal';
import { OFFICIAL_PRIORITIES, WORK_QUEUES } from '@/constants';
import { useTickets } from '@/context/TicketContext';
import type { OfficialPriority, WorkQueue } from '@/types';
import { fromDateInputValue } from '@/utils';

interface AddTicketModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function AddTicketModal({ open, onClose, onCreated }: AddTicketModalProps) {
  const { addTicket, settings } = useTickets();

  const [ticketNumber, setTicketNumber] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [primaryContact, setPrimaryContact] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState(settings.ticketSources[0] ?? '');
  const [officialPriority, setOfficialPriority] = useState<OfficialPriority>('Medium');
  const [workQueue, setWorkQueue] = useState<WorkQueue>('When You Have Time');
  const [followUpDate, setFollowUpDate] = useState('');
  const [tags, setTags] = useState('');

  const reset = () => {
    setTicketNumber('');
    setTitle('');
    setDescription('');
    setPrimaryContact('');
    setCompany('');
    setSource(settings.ticketSources[0] ?? '');
    setOfficialPriority('Medium');
    setWorkQueue('When You Have Time');
    setFollowUpDate('');
    setTags('');
  };

  const handleSubmit = () => {
    if (!ticketNumber.trim() || !title.trim()) return;
    const ticket = addTicket({
      ticketNumber: ticketNumber.trim(),
      title: title.trim(),
      description: description.trim(),
      primaryContact: primaryContact.trim(),
      company: company.trim(),
      source,
      officialPriority,
      workQueue,
      followUpDate: fromDateInputValue(followUpDate),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
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
      title="Add Ticket"
      subtitle="Create a new support ticket and place it in your work queue"
      size="lg"
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
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Ticket
          </button>
        </>
      }
    >
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
            placeholder="Brief description of the issue"
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Description" className="col-span-2">
          <textarea
            className={`${inputClass} min-h-[70px] resize-y`}
            value={description}
            placeholder="Detailed description of the issue"
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Primary Contact">
          <input
            className={inputClass}
            value={primaryContact}
            placeholder="Contact name"
            onChange={(e) => setPrimaryContact(e.target.value)}
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
        <Field label="Follow-up Date">
          <input
            type="date"
            className={inputClass}
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </Field>
        <Field label="Tags (comma-separated)" className="col-span-2">
          <input
            className={inputClass}
            value={tags}
            placeholder="backup, sql, urgent"
            onChange={(e) => setTags(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
