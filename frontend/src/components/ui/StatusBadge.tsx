
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const configs: Record<string, { label: string; classes: string }> = {
    DRAFT:      { label: 'Draft',     classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    SUBMITTED:  { label: 'Submitted', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
    APPROVED:   { label: 'Approved',  classes: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
    RETURNED:   { label: 'Returned',  classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
      configs[status]?.classes,
      size === 'sm' && "px-2 py-0 text-[10px] uppercase tracking-wider",
      className
    )}>
      {configs[status]?.label || status}
    </span>
  );
}
