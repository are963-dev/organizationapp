import type { OfficialPriority } from '@/types';
import { PRIORITY_STYLES } from '@/constants';

interface PriorityBadgeProps {
  priority: OfficialPriority;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const s = PRIORITY_STYLES[priority];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium ${s.badge} ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

interface PriorityDotProps {
  priority: OfficialPriority;
}

export function PriorityDot({ priority }: PriorityDotProps) {
  const s = PRIORITY_STYLES[priority];
  return (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${s.dot}`} title={s.label} />
  );
}
