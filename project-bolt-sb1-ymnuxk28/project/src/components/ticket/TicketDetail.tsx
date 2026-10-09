import { useEffect, useState } from 'react';
import {
  X,
  Building2,
  User,
  Tag,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Plus,
  MessageSquarePlus,
  Save,
  AlertTriangle,
  ExternalLink,
  GitBranch,
  Mail,
  Phone,
  Globe,
  UserCog,
  ShieldCheck,
} from 'lucide-react';
import type { Ticket, OfficialPriority, WorkQueue } from '@/types';
import { OFFICIAL_PRIORITIES, WORK_QUEUES, PRIORITY_STYLES } from '@/constants';
import { useTickets } from '@/context/TicketContext';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal, Field, inputClass } from '@/components/ui/Modal';
import {
  formatDate,
  formatDateTime,
  formatTime,
  toDateInputValue,
  fromDateInputValue,
  relativeTime,
} from '@/utils';

interface TicketDetailProps {
  ticket: Ticket | null;
  onClose: () => void;
  onComplete: (id: string) => void;
}

type EditState = {
  ticketNumber: string;
  title: string;
  description: string;
  primaryContact: string;
  company: string;
  source: string;
  officialPriority: OfficialPriority;
  workQueue: WorkQueue;
  followUpDate: string;
  tags: string;
};

function toEditState(t: Ticket): EditState {
  return {
    ticketNumber: t.ticketNumber,
    title: t.title,
    description: t.description,
    primaryContact: t.primaryContact,
    company: t.company,
    source: t.source,
    officialPriority: t.officialPriority,
    workQueue: t.workQueue,
    followUpDate: toDateInputValue(t.followUpDate),
    tags: t.tags.join(', '),
  };
}

export function TicketDetail({ ticket, onClose, onComplete }: TicketDetailProps) {
  const { updateTicket, deleteTicket, addUpdate, settings, tickets } = useTickets();
  const [edit, setEdit] = useState<EditState | null>(null);
  const [updateText, setUpdateText] = useState('');
  const [showComplete, setShowComplete] = useState(false);
  const [resolution, setResolution] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    setEdit(ticket ? toEditState(ticket) : null);
    setUpdateText('');
    setResolution('');
  }, [ticket]);

  if (!ticket || !edit) return null;

  const isEditing = edit.title !== ticket.title || edit.ticketNumber !== ticket.ticketNumber ||
    edit.description !== ticket.description || edit.primaryContact !== ticket.primaryContact ||
    edit.company !== ticket.company || edit.source !== ticket.source ||
    edit.officialPriority !== ticket.officialPriority || edit.workQueue !== ticket.workQueue ||
    edit.followUpDate !== toDateInputValue(ticket.followUpDate) ||
    edit.tags !== ticket.tags.join(', ');

  const handleSave = () => {
    updateTicket(ticket.id, {
      ticketNumber: edit.ticketNumber,
      title: edit.title,
      description: edit.description,
      primaryContact: edit.primaryContact,
      company: edit.company,
      source: edit.source,
      officialPriority: edit.officialPriority,
      workQueue: edit.workQueue,
      followUpDate: fromDateInputValue(edit.followUpDate),
      tags: edit.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  const handleAddUpdate = () => {
    if (!updateText.trim()) return;
    addUpdate(ticket.id, updateText.trim());
    setUpdateText('');
  };

  const handleComplete = () => {
    onComplete(ticket.id);
    setShowComplete(false);
    onClose();
  };

  const handleDelete = () => {
    deleteTicket(ticket.id);
    setShowDelete(false);
    onClose();
  };

  const sortedUpdates = [...ticket.updates].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  const fuStatus = ticket.followUpDate
    ? new Date(ticket.followUpDate) < new Date() && new Date(ticket.followUpDate).toDateString() !== new Date().toDateString()
      ? 'overdue'
      : 'upcoming'
    : 'none';

  const qmon = ticket.qmon;
  const legacyTicket = ticket.legacyCaseNumber
    ? tickets.find((t) => t.ticketNumber === ticket.legacyCaseNumber)
    : null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

        <div className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl animate-in slide-in-from-right">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-medium text-slate-500">
                  {ticket.ticketNumber}
                </span>
                <PriorityBadge priority={ticket.officialPriority} />
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {ticket.workQueue}
                </span>
                {qmon && (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-600 border border-sky-200">
                    QMON
                  </span>
                )}
                {ticket.archived && (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500">
                    Archived
                  </span>
                )}
              </div>
              <h2 className="mt-1.5 text-lg font-semibold text-slate-900">
                {ticket.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* QMON info bar */}
            {qmon && (
              <section className="rounded-lg border border-sky-200 bg-sky-50/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">QMON Information</h3>
                  {qmon.ticketUrl && (
                    <a
                      href={qmon.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
                    >
                      <ExternalLink size={13} />
                      Open Ticket
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <QmonInfoItem icon={<UserCog size={12} />} label="Owner" value={qmon.owner} />
                  <QmonInfoItem icon={<UserCog size={12} />} label="Assigned" value={qmon.assignedEngineer} />
                  <QmonInfoItem icon={<Globe size={12} />} label="Source" value={qmon.source} />
                  <QmonInfoItem icon={<Clock size={12} />} label="Age" value={qmon.age} />
                  <QmonInfoItem icon={<Calendar size={12} />} label="Created" value={formatDate(ticket.createdAt)} />
                  <QmonInfoItem icon={<Clock size={12} />} label="Last Updated" value={qmon.lastUpdated ? formatDateTime(qmon.lastUpdated) : '—'} />
                  <QmonInfoItem icon={<Globe size={12} />} label="Status" value={qmon.officialStatus} />
                  <QmonInfoItem icon={<Tag size={12} />} label="Product" value={qmon.product} />
                  <QmonInfoItem icon={<Mail size={12} />} label="Email" value={qmon.email} />
                  <QmonInfoItem icon={<Phone size={12} />} label="Phone" value={qmon.phone} />
                  <QmonInfoItem icon={<Globe size={12} />} label="Region" value={qmon.region} />
                  <QmonInfoItem icon={<Globe size={12} />} label="Country" value={qmon.country} />
                  <QmonInfoItem icon={<ShieldCheck size={12} />} label="Compliance" value={qmon.compliance} />
                </div>
              </section>
            )}

            {/* Legacy case reference */}
            {ticket.legacyCaseNumber && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-center gap-2">
                <GitBranch size={16} className="text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Related Legacy Case</p>
                  {legacyTicket ? (
                    <button
                      onClick={() => {
                        // Navigate to the legacy ticket
                        const event = new CustomEvent('open-ticket', { detail: legacyTicket.id });
                        window.dispatchEvent(event);
                      }}
                      className="text-sm font-medium text-amber-700 hover:text-amber-800 underline"
                    >
                      {ticket.legacyCaseNumber} — {legacyTicket.title}
                    </button>
                  ) : (
                    <span className="text-sm font-medium text-amber-700">
                      {ticket.legacyCaseNumber}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Editable fields */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Ticket Information</h3>
                {isEditing && (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
                  >
                    <Save size={14} />
                    Save Changes
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Ticket Number">
                  <input
                    className={inputClass}
                    value={edit.ticketNumber}
                    onChange={(e) => setEdit({ ...edit, ticketNumber: e.target.value })}
                  />
                </Field>
                <Field label="Ticket Source">
                  <select
                    className={inputClass}
                    value={edit.source}
                    onChange={(e) => setEdit({ ...edit, source: e.target.value })}
                  >
                    {settings.ticketSources.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Title" className="col-span-2">
                  <input
                    className={inputClass}
                    value={edit.title}
                    onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                  />
                </Field>
                <Field label="Description" className="col-span-2">
                  <textarea
                    className={`${inputClass} min-h-[80px] resize-y`}
                    value={edit.description}
                    onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                  />
                </Field>
                <Field label="Primary Contact">
                  <input
                    className={inputClass}
                    value={edit.primaryContact}
                    onChange={(e) => setEdit({ ...edit, primaryContact: e.target.value })}
                  />
                </Field>
                <Field label="Company">
                  <input
                    className={inputClass}
                    value={edit.company}
                    onChange={(e) => setEdit({ ...edit, company: e.target.value })}
                  />
                </Field>
                <Field label="Official Priority">
                  <select
                    className={inputClass}
                    value={edit.officialPriority}
                    onChange={(e) => setEdit({ ...edit, officialPriority: e.target.value as OfficialPriority })}
                  >
                    {OFFICIAL_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Field label="My Work Queue">
                  <select
                    className={inputClass}
                    value={edit.workQueue}
                    onChange={(e) => setEdit({ ...edit, workQueue: e.target.value as WorkQueue })}
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
                    value={edit.followUpDate}
                    onChange={(e) => setEdit({ ...edit, followUpDate: e.target.value })}
                  />
                </Field>
                <Field label="Tags (comma-separated)">
                  <input
                    className={inputClass}
                    value={edit.tags}
                    placeholder="backup, sql, urgent"
                    onChange={(e) => setEdit({ ...edit, tags: e.target.value })}
                  />
                </Field>
              </div>

              {/* Read-only metadata */}
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  Created: {formatDateTime(ticket.createdAt)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} />
                  Updated: {relativeTime(ticket.updatedAt)}
                </div>
                {ticket.completedAt && (
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 size={12} />
                    Completed: {formatDateTime(ticket.completedAt)}
                  </div>
                )}
                {fuStatus === 'overdue' && (
                  <div className="flex items-center gap-1.5 text-red-600 font-medium">
                    <AlertTriangle size={12} />
                    Follow-up overdue: {formatDate(ticket.followUpDate)}
                  </div>
                )}
              </div>
            </section>

            {/* Resolution (if completed) */}
            {ticket.archived && ticket.resolution && (
              <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-semibold text-emerald-800">Resolution</h3>
                </div>
                <p className="text-sm text-emerald-700">{ticket.resolution}</p>
              </section>
            )}

            {/* Updates timeline */}
            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Updates & Activity Timeline
              </h3>

              {/* Add update */}
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <textarea
                  className={`${inputClass} min-h-[60px] resize-y mb-2`}
                  placeholder="Add a quick update..."
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleAddUpdate();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Press Cmd/Ctrl+Enter to add
                  </p>
                  <button
                    onClick={handleAddUpdate}
                    disabled={!updateText.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquarePlus size={14} />
                    Add Update
                  </button>
                </div>
              </div>

              {/* Timeline */}
              {sortedUpdates.length === 0 ? (
                <p className="py-6 text-sm text-slate-400 text-center">
                  No updates yet. Add the first update above.
                </p>
              ) : (
                <div className="relative space-y-0">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />

                  {sortedUpdates.map((update, i) => (
                    <div key={update.id} className="relative flex gap-3 pb-4">
                      <div
                        className={`relative z-10 mt-1 h-3.5 w-3.5 rounded-full border-2 border-white shrink-0 ${
                          update.isSystem
                            ? 'bg-sky-400'
                            : i === 0
                            ? 'bg-slate-900'
                            : 'bg-slate-300'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700">
                            {formatTime(update.createdAt)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(update.createdAt)}
                          </span>
                          {i === 0 && !update.isSystem && (
                            <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-xs font-medium text-white">
                              Latest
                            </span>
                          )}
                          {update.isSystem && (
                            <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-600">
                              System
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                          {update.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Footer actions */}
          <div className="flex items-center gap-2 border-t border-slate-100 px-6 py-3">
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={15} />
              Delete
            </button>
            <div className="flex-1" />
            {qmon?.ticketUrl && (
              <a
                href={qmon.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ExternalLink size={15} />
                Open Ticket
              </a>
            )}
            <button
              onClick={() => setShowComplete(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 size={15} />
              Complete Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Complete dialog */}
      <Modal
        open={showComplete}
        onClose={() => setShowComplete(false)}
        title="Complete Ticket"
        subtitle={`${ticket.ticketNumber} — ${ticket.title}`}
        footer={
          <>
            <button
              onClick={() => setShowComplete(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Complete & Archive
            </button>
          </>
        }
      >
        <Field label="Resolution Note (optional)">
          <textarea
            className={`${inputClass} min-h-[100px] resize-y`}
            placeholder="Summarize how this ticket was resolved..."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          />
        </Field>
      </Modal>

      {/* Delete dialog */}
      <ConfirmDialog
        open={showDelete}
        title="Delete Ticket"
        message={`Permanently delete ${ticket.ticketNumber}? This cannot be undone. All updates and history will be lost.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}

function QmonInfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-400 shrink-0">{icon}</span>
      <span className="text-slate-500">{label}:</span>
      <span className="text-slate-700 font-medium truncate">{value}</span>
    </div>
  );
}
