import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string | ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  const DisplayIcon = Icon ?? Inbox;

  return (
    <div className={cn("flex flex-col items-center justify-center py-20 text-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
        <DisplayIcon className="w-8 h-8 text-slate-400 dark:text-slate-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mx-auto">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-6 bg-brand-orange hover:bg-orange-600 text-white gap-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
