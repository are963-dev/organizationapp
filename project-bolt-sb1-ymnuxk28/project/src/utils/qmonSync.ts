import type { Ticket, TicketUpdate, WorkQueue, SyncSummary, OfficialPriority } from '@/types';
import { uid, nowISO } from '@/utils';
import { QMON_CLOSED_STATUSES } from '@/constants';
import {
  parseQmonResponseDetailed,
  toQmonFields,
  detectSourceSystem,
  extractLegacyCaseNumber,
  type ParsedQmonTicket,
} from '@/utils/qmonParser';

export interface SyncResult {
  summary: SyncSummary;
  tickets: Ticket[];
  success: boolean;
  error: string | null;
}

function isQmonClosed(status: string): boolean {
  return QMON_CLOSED_STATUSES.some(
    (s) => status.toLowerCase().trim() === s.toLowerCase().trim()
  );
}

function systemUpdate(text: string): TicketUpdate {
  return { id: uid(), text, createdAt: nowISO(), isSystem: true };
}

function describeChange(field: string, oldVal: string, newVal: string): string {
  return `QMON Sync\n${field} changed: ${oldVal} → ${newVal}`;
}

/**
 * Detect meaningful changes between the existing ticket's QMON fields
 * and the newly parsed QMON data. Returns an array of system update entries.
 */
function detectChanges(existing: Ticket, parsed: ParsedQmonTicket): TicketUpdate[] {
  const updates: TicketUpdate[] = [];
  const qmon = existing.qmon;

  if (parsed.priority !== existing.officialPriority) {
    updates.push(systemUpdate(
      describeChange('Priority', existing.officialPriority, parsed.priority)
    ));
  }

  if (qmon && parsed.officialStatus !== qmon.officialStatus) {
    updates.push(systemUpdate(
      describeChange('Status', qmon.officialStatus, parsed.officialStatus)
    ));
  }

  if (qmon && parsed.assignedEngineer !== qmon.assignedEngineer) {
    updates.push(systemUpdate(
      describeChange('Assigned engineer', qmon.assignedEngineer || '—', parsed.assignedEngineer || '—')
    ));
  }

  if (parsed.subject !== existing.title) {
    updates.push(systemUpdate(
      describeChange('Subject', existing.title, parsed.subject)
    ));
  }

  if (parsed.company !== existing.company) {
    updates.push(systemUpdate(
      describeChange('Customer', existing.company || '—', parsed.company || '—')
    ));
  }

  if (qmon && parsed.lastUpdated && qmon.lastUpdated !== parsed.lastUpdated) {
    updates.push(systemUpdate('QMON Sync\nLast updated changed in QMON'));
  }

  return updates;
}

/**
 * Check if the QMON-controlled fields have actually changed.
 * Used to avoid creating duplicate history entries on idempotent syncs.
 */
function hasQmonChanges(existing: Ticket, parsed: ParsedQmonTicket): boolean {
  const qmon = existing.qmon;
  if (!qmon) return true;

  return (
    parsed.priority !== existing.officialPriority ||
    parsed.officialStatus !== qmon.officialStatus ||
    parsed.assignedEngineer !== qmon.assignedEngineer ||
    parsed.subject !== existing.title ||
    parsed.company !== existing.company ||
    (parsed.lastUpdated ?? '') !== (qmon.lastUpdated ?? '')
  );
}

/**
 * Find the max board position for a given work queue among active tickets.
 */
function maxBoardPosition(tickets: Ticket[], queue: WorkQueue): number {
  return tickets
    .filter((t) => t.workQueue === queue && !t.archived)
    .reduce((max, t) => Math.max(max, t.boardPosition), -1);
}

/**
 * Merge parsed QMON tickets into the existing localStorage ticket array.
 *
 * Rules:
 * - New open QMON ticket   → create with workQueue "Next Up", placed at end of queue
 * - New closed QMON ticket → create already archived with reason "qmon_closed"
 * - Existing ticket        → update only QMON-controlled fields, preserve personal data
 * - QMON-closed active ticket → archive with reason "qmon_closed"
 * - QMON-reopened ticket (archived with reason "qmon_closed") → reopen
 * - Manually archived/completed tickets → never reopen
 * - No changes detected → no history entries (idempotent)
 * - Malformed rows are skipped individually, never aborting the rest
 */
export function syncTickets(
  existingTickets: Ticket[],
  rawQmonResponse: string
): SyncResult {
  const report = parseQmonResponseDetailed(rawQmonResponse);
  const parsed = report.tickets;

  console.log('[qmon-sync] Response received', {
    responseLength: report.responseLength,
    rowsReceived: report.rowsReceived,
    rowsParsed: report.rowsParsed,
    rowsSkipped: report.rowsSkipped,
    duplicateNumbers: report.duplicateNumbers,
    ticketNumbers: parsed.map((p) => p.ticketNumber),
  });
  for (const skip of report.skipped) {
    console.log(
      `[qmon-sync] Skipped row (${skip.reason})${skip.ticketNumber ? ': ' + skip.ticketNumber : ''}`
    );
  }

  if (parsed.length === 0) {
    console.log('[qmon-sync] No valid ticket records found. Existing data preserved.');
    return {
      success: false,
      error: 'QMON response was empty or contained no valid ticket records.',
      summary: {
        checked: report.rowsReceived,
        added: 0,
        updated: 0,
        archived: 0,
        reopened: 0,
        unchanged: 0,
        timestamp: nowISO(),
      },
      tickets: existingTickets,
    };
  }

  const qmonByNumber = new Map<string, ParsedQmonTicket>();
  for (const p of parsed) {
    // Duplicate ticket number in the same response: last row wins, mirroring
    // the original behavior. Duplicates are logged above for visibility.
    qmonByNumber.set(p.ticketNumber, p);
  }

  let added = 0;
  let updated = 0;
  let archived = 0;
  let reopened = 0;
  let unchanged = 0;

  let tickets = [...existingTickets];

  // Process existing tickets: update QMON fields, handle close/reopen
  tickets = tickets.map((ticket) => {
    const qmonData = qmonByNumber.get(ticket.ticketNumber);

    // If this ticket is not in the QMON response, leave it untouched
    if (!qmonData) return ticket;

    const isClosed = isQmonClosed(qmonData.officialStatus);
    const wasQmonArchived = ticket.archived && ticket.archiveReason === 'qmon_closed';

    // Case: ticket was archived because QMON closed it, and QMON now shows it open
    if (!isClosed && wasQmonArchived) {
      const changes = detectChanges(ticket, qmonData);
      const newUpdates = [
        systemUpdate('QMON Sync\nTicket automatically reopened because it was reopened in QMON'),
        ...changes,
      ];
      reopened++;
      return {
        ...ticket,
        archived: false,
        archiveReason: null,
        completedAt: null,
        resolution: null,
        qmon: toQmonFields(qmonData),
        officialPriority: qmonData.priority,
        title: qmonData.subject,
        primaryContact: qmonData.contact,
        company: qmonData.company,
        source: detectSourceSystem(qmonData),
        ticketNumber: qmonData.ticketNumber,
        legacyCaseNumber: extractLegacyCaseNumber(qmonData.subject),
        updates: [...ticket.updates, ...newUpdates],
        updatedAt: nowISO(),
      };
    }

    // Case: ticket is active and QMON now shows it closed → archive
    if (isClosed && !ticket.archived) {
      archived++;
      return {
        ...ticket,
        archived: true,
        archiveReason: 'qmon_closed',
        qmon: toQmonFields(qmonData),
        officialPriority: qmonData.priority,
        title: qmonData.subject,
        primaryContact: qmonData.contact,
        company: qmonData.company,
        source: detectSourceSystem(qmonData),
        legacyCaseNumber: extractLegacyCaseNumber(qmonData.subject),
        updates: [
          ...ticket.updates,
          systemUpdate('QMON Sync\nTicket automatically archived because it was closed in QMON'),
        ],
        updatedAt: nowISO(),
      };
    }

    // Case: ticket is already manually archived/completed and QMON shows it open
    // Do NOT reopen manually archived tickets
    if (!isClosed && ticket.archived && ticket.archiveReason !== 'qmon_closed') {
      // Still update QMON fields silently
      return {
        ...ticket,
        qmon: toQmonFields(qmonData),
        officialPriority: qmonData.priority,
      };
    }

    // Case: ticket is active (or already qmon_archived and still closed) → update QMON fields
    if (hasQmonChanges(ticket, qmonData)) {
      const changes = detectChanges(ticket, qmonData);
      updated++;
      return {
        ...ticket,
        qmon: toQmonFields(qmonData),
        officialPriority: qmonData.priority,
        title: qmonData.subject,
        primaryContact: qmonData.contact,
        company: qmonData.company,
        source: detectSourceSystem(qmonData),
        ticketNumber: qmonData.ticketNumber,
        legacyCaseNumber: extractLegacyCaseNumber(qmonData.subject),
        updates: changes.length > 0 ? [...ticket.updates, ...changes] : ticket.updates,
        updatedAt: nowISO(),
      };
    }

    // No meaningful changes — idempotent
    unchanged++;
    return ticket;
  });

  // Process QMON tickets that don't exist in localStorage yet
  for (const qmonData of parsed) {
    const exists = tickets.some((t) => t.ticketNumber === qmonData.ticketNumber);
    if (exists) continue;

    const isClosed = isQmonClosed(qmonData.officialStatus);
    const queue: WorkQueue = 'Next Up';
    const pos = maxBoardPosition(tickets, queue) + 1;

    const newTicket: Ticket = {
      id: uid(),
      ticketNumber: qmonData.ticketNumber,
      title: qmonData.subject,
      description: '',
      primaryContact: qmonData.contact,
      company: qmonData.company,
      source: detectSourceSystem(qmonData),
      officialPriority: qmonData.priority as OfficialPriority,
      workQueue: queue,
      boardPosition: pos,
      tags: [],
      followUpDate: null,
      createdAt: qmonData.createdAt ?? nowISO(),
      updatedAt: nowISO(),
      completedAt: null,
      resolution: null,
      updates: [systemUpdate('QMON Sync\nTicket imported from QMON')],
      archived: false,
      archiveReason: null,
      qmon: toQmonFields(qmonData),
      legacyCaseNumber: extractLegacyCaseNumber(qmonData.subject),
    };

    // Business rule: tickets already closed in QMON are imported straight into
    // the archive so the full QMON list is visible without polluting the board.
    if (isClosed) {
      tickets.push({
        ...newTicket,
        archived: true,
        archiveReason: 'qmon_closed',
        completedAt: qmonData.lastUpdated ?? nowISO(),
        updates: [...newTicket.updates, systemUpdate('QMON Sync\nTicket archived because it was already closed in QMON')],
      });
      archived++;
    } else {
      tickets.push(newTicket);
      added++;
    }
  }

  const summary: SyncSummary = {
    checked: report.rowsReceived,
    added,
    updated,
    archived,
    reopened,
    unchanged,
    timestamp: nowISO(),
  };

  console.log('[qmon-sync] Complete', {
    checked: summary.checked,
    added,
    updated,
    archived,
    reopened,
    unchanged,
    skipped: report.rowsSkipped,
  });

  return { summary, tickets, success: true, error: null };
}
