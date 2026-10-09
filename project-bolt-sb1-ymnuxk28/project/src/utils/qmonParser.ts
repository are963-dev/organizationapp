import type { QmonFields, OfficialPriority } from '@/types';
import { normalizeQmonPriority } from '@/constants';

// QMON pipe-delimited field positions (0-indexed).
// These positions are fixed and must not shift even when fields are empty.
const FIELD = {
  FEED_TIMESTAMP: 0,
  TICKET_NUMBER: 1,
  PRODUCT: 2,
  PRIORITY: 3,
  OWNER: 4,
  SOURCE: 5,
  AGE: 6,
  CREATED_DATE: 7,
  LAST_UPDATED: 8,
  STATUS: 9,
  ASSIGNED_ENGINEER: 10,
  CONTACT: 11,
  PHONE: 12,
  EMAIL: 13,
  REGION: 14,
  COUNTRY: 15,
  // 16, 17, 18: unused internal fields
  COMPANY: 19,
  // 20, 21: unused internal fields
  COMPLIANCE: 22,
  // 23, 24: internal/sensitive fields — NOT parsed or stored
  // 25+: the ticket deep link (<a href="...">...</a>) and/or the title text.
  //      QMON does not escape pipes inside this field, so everything from index
  //      25 onward must be re-joined before parsing.
  LINK_FIELD: 25,
} as const;

export interface ParsedQmonTicket {
  ticketNumber: string;
  product: string;
  priority: OfficialPriority;
  owner: string;
  source: string;
  age: string;
  createdAt: string | null;
  lastUpdated: string | null;
  officialStatus: string;
  assignedEngineer: string;
  contact: string;
  phone: string;
  email: string;
  region: string;
  country: string;
  company: string;
  compliance: string;
  ticketUrl: string;
  subject: string;
  feedTimestamp: string | null;
}

export interface SkippedQmonRow {
  reason: string;
  ticketNumber: string | null;
}

export interface QmonParseReport {
  tickets: ParsedQmonTicket[];
  responseLength: number;
  rowsReceived: number;
  rowsParsed: number;
  rowsSkipped: number;
  skipped: SkippedQmonRow[];
  duplicateNumbers: string[];
}

const TICKET_NUMBER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\-/_.]*$/;

/**
 * Parse a date string from QMON into ISO format.
 * Handles formats like "10/7/2026 2:19:24 PM", "10/7/2026, 2:19:59 PM"
 * and "2/14/2025 2:35 PM". Falls back to native parsing. Returns null on failure.
 */
function parseQmonDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  const m = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i
  );
  if (m) {
    const month = Number(m[1]);
    const day = Number(m[2]);
    const year = Number(m[3]);
    let hours = Number(m[4]);
    const minutes = Number(m[5]);
    const seconds = m[6] ? Number(m[6]) : 0;
    const meridiem = (m[7] ?? '').toUpperCase();
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    const d = new Date(year, month - 1, day, hours, minutes, seconds);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#x2f;/gi, '/')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripHtmlTags(raw: string): string {
  return raw.replace(/<[^>]*>/g, ' ');
}

function collapseSpaces(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

// The deep-link field's URL may be followed by a pipe and the leading fragment
// of the title (e.g. "…TENANTID=829453953|Error"). A URL-form fragment is never
// title text, so only split off short fragments that contain no URL syntax.
const URL_FRAGMENT_PATTERN = /[\\/?#&=%.]/;

/**
 * Extract the ticket URL and title from the trailing QMON field.
 * The field is either a plain title or an HTML anchor whose href/title/text
 * may contain unescaped pipe characters.
 */
function extractLinkField(raw: string): { url: string | null; title: string } {
  const decoded = decodeHtmlEntities(raw);
  const hrefMatch = decoded.match(/href\s*=\s*["']([^"']*)["']/i);
  const closeIdx = decoded.lastIndexOf('</a>');

  const titleTail =
    closeIdx >= 0
      ? collapseSpaces(stripHtmlTags(decoded.slice(closeIdx + 4)))
      : '';

  if (!hrefMatch) {
    // No anchor: the whole field is plain title text.
    const plain = collapseSpaces(stripHtmlTags(decoded));
    return { url: null, title: titleTail || plain };
  }

  const rawHref = hrefMatch[1].trim();
  let url = rawHref;
  let lead = '';

  const lastPipe = rawHref.lastIndexOf('|');
  if (lastPipe >= 0 && lastPipe < rawHref.length - 1) {
    const fragment = rawHref.slice(lastPipe + 1).trim();
    if (fragment && !URL_FRAGMENT_PATTERN.test(fragment)) {
      url = rawHref.slice(0, lastPipe);
      lead = fragment;
    }
  }

  const title = collapseSpaces([lead, titleTail].filter(Boolean).join(' '));
  return { url: url || null, title };
}

export type QmonLineResult =
  | { ok: true; ticket: ParsedQmonTicket }
  | { ok: false; reason: string; ticketNumber: string | null };

/**
 * Parse a single QMON record into a structured ticket. Empty fields are
 * preserved as empty strings and do NOT shift subsequent fields.
 */
// A valid QMON record has 26 fixed pipe-delimited columns (indexes 0..25).
const MIN_FIELDS = 26;

export function parseQmonLineResult(line: string): QmonLineResult {
  const fields = line.split('|');
  if (fields.length < MIN_FIELDS) {
    return { ok: false, reason: 'too few fields', ticketNumber: null };
  }

  const ticketNumber = (fields[FIELD.TICKET_NUMBER] ?? '').trim();
  if (!ticketNumber) {
    return { ok: false, reason: 'empty ticket number', ticketNumber: null };
  }
  if (!TICKET_NUMBER_PATTERN.test(ticketNumber)) {
    return { ok: false, reason: 'invalid ticket number format', ticketNumber };
  }

  const tail =
    fields.length > FIELD.LINK_FIELD
      ? fields.slice(FIELD.LINK_FIELD).join('|')
      : '';
  const { url, title } = extractLinkField(tail);

  return {
    ok: true,
    ticket: {
      ticketNumber,
      product: (fields[FIELD.PRODUCT] ?? '').trim(),
      priority: normalizeQmonPriority(fields[FIELD.PRIORITY] ?? ''),
      owner: (fields[FIELD.OWNER] ?? '').trim(),
      source: (fields[FIELD.SOURCE] ?? '').trim(),
      age: (fields[FIELD.AGE] ?? '').trim(),
      createdAt: parseQmonDate(fields[FIELD.CREATED_DATE] ?? ''),
      lastUpdated: parseQmonDate(fields[FIELD.LAST_UPDATED] ?? ''),
      officialStatus: (fields[FIELD.STATUS] ?? '').trim(),
      assignedEngineer: (fields[FIELD.ASSIGNED_ENGINEER] ?? '').trim(),
      contact: (fields[FIELD.CONTACT] ?? '').trim(),
      phone: (fields[FIELD.PHONE] ?? '').trim(),
      email: (fields[FIELD.EMAIL] ?? '').trim(),
      region: (fields[FIELD.REGION] ?? '').trim(),
      country: (fields[FIELD.COUNTRY] ?? '').trim(),
      company: (fields[FIELD.COMPANY] ?? '').trim(),
      compliance: (fields[FIELD.COMPLIANCE] ?? '').trim(),
      ticketUrl: url ?? '',
      subject: title,
      feedTimestamp: parseQmonDate(fields[FIELD.FEED_TIMESTAMP] ?? ''),
    },
  };
}

/** Split the raw QMON text into record rows. */
function splitRows(text: string): string[] {
  const rows: string[] = [];
  for (const line of text.split(/\r\n|\n|\r/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.includes('<br')) {
      for (const part of trimmed.split(/<br\s*\/?>/i)) {
        if (part.trim()) rows.push(part.trim());
      }
    } else {
      rows.push(trimmed);
    }
  }
  return rows;
}

/**
 * Parse the full QMON plain-text response into structured tickets plus
 * diagnostic information. Skips malformed rows without aborting the rest.
 */
export function parseQmonResponseDetailed(text: string): QmonParseReport {
  const rows = splitRows(text);

  const tickets: ParsedQmonTicket[] = [];
  const skipped: SkippedQmonRow[] = [];
  const duplicateNumbers: string[] = [];
  const seen = new Set<string>();

  for (const line of rows) {
    const result = parseQmonLineResult(line);
    if (!result.ok) {
      skipped.push({ reason: result.reason, ticketNumber: result.ticketNumber });
      continue;
    }
    if (seen.has(result.ticket.ticketNumber)) {
      duplicateNumbers.push(result.ticket.ticketNumber);
    }
    seen.add(result.ticket.ticketNumber);
    tickets.push(result.ticket);
  }

  return {
    tickets,
    responseLength: text.length,
    rowsReceived: rows.length,
    rowsParsed: tickets.length,
    rowsSkipped: skipped.length,
    skipped,
    duplicateNumbers,
  };
}

/**
 * Convert a ParsedQmonTicket into the QmonFields shape stored on the Ticket.
 */
export function toQmonFields(parsed: ParsedQmonTicket): QmonFields {
  return {
    feedTimestamp: parsed.feedTimestamp,
    product: parsed.product,
    owner: parsed.owner,
    source: parsed.source,
    age: parsed.age,
    lastUpdated: parsed.lastUpdated,
    officialStatus: parsed.officialStatus,
    assignedEngineer: parsed.assignedEngineer,
    phone: parsed.phone,
    email: parsed.email,
    region: parsed.region,
    country: parsed.country,
    compliance: parsed.compliance,
    ticketUrl: parsed.ticketUrl,
  };
}

/**
 * Detect the source system from the ticket URL or QMON data.
 * Handles Salesforce and SMAX.
 */
export function detectSourceSystem(parsed: ParsedQmonTicket): string {
  const url = parsed.ticketUrl.toLowerCase();
  if (url.includes('salesforce') || url.includes('lightning.force.com')) return 'Salesforce';
  if (url.includes('smax') || url.includes('microfocus.com/smax')) return 'SMAX';
  return parsed.source || 'Unknown';
}

const LEGACY_CASE_PATTERN = /Legacy\s+Case:\s*([A-Za-z0-9-]+)/i;

/**
 * Extract a legacy case number from the ticket subject, if present.
 * Returns null if the pattern cannot be reliably determined.
 */
export function extractLegacyCaseNumber(subject: string): string | null {
  const match = subject.match(LEGACY_CASE_PATTERN);
  return match ? match[1] : null;
}
