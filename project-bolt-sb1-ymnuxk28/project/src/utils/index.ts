import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
  } catch {
    return '—';
  }
}

export function formatTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'h:mm a');
  } catch {
    return '';
  }
}

export function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}

export function followUpStatus(dateStr: string | null): 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none' {
  if (!dateStr) return 'none';
  try {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    if (isPast(d) && !isToday(d)) return 'overdue';
    if (isToday(d)) return 'today';
    if (isTomorrow(d)) return 'tomorrow';
    return 'upcoming';
  } catch {
    return 'none';
  }
}

export function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

export function fromDateInputValue(val: string): string | null {
  if (!val) return null;
  return new Date(val + 'T12:00:00').toISOString();
}

export function sortByBoardPosition(a: { boardPosition: number }, b: { boardPosition: number }): number {
  return a.boardPosition - b.boardPosition;
}
