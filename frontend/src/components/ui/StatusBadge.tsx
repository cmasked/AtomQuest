
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    DRAFT:       { label: 'Draft',       bg: 'bg-slate-100 dark:bg-slate-800',        text: 'text-slate-600 dark:text-slate-400',   dot: 'bg-slate-400' },
    SUBMITTED:   { label: 'Submitted',   bg: 'bg-amber-100 dark:bg-amber-900/40',     text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500' },
    APPROVED:    { label: 'Approved',    bg: 'bg-green-100 dark:bg-green-900/40',     text: 'text-green-700 dark:text-green-400',   dot: 'bg-green-500' },
    RETURNED:    { label: 'Returned',    bg: 'bg-red-100 dark:bg-red-900/40',         text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500' },
    NOT_STARTED: { label: 'Not Started', bg: 'bg-slate-100 dark:bg-slate-800',        text: 'text-slate-500 dark:text-slate-500',   dot: 'bg-slate-400' },
    ON_TRACK:    { label: 'On Track',    bg: 'bg-green-100 dark:bg-green-900/40',     text: 'text-green-700 dark:text-green-400',   dot: 'bg-green-500' },
    COMPLETED:   { label: 'Completed',   bg: 'bg-blue-100 dark:bg-blue-900/40',       text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500' },
    ACTIVE:      { label: 'Active',      bg: 'bg-green-100 dark:bg-green-900/40',     text: 'text-green-700 dark:text-green-400',   dot: 'bg-green-500 animate-pulse' },
    INACTIVE:    { label: 'Inactive',    bg: 'bg-slate-100 dark:bg-slate-800',        text: 'text-slate-500 dark:text-slate-500',   dot: 'bg-slate-400' },
  };

  const config = STATUS_CONFIG[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
      config.bg, config.text,
      size === 'sm' && "px-2 py-0 text-[10px] uppercase tracking-wider",
      className
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      {config.label}
    </span>
  );
}
