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
    <div className={cn("flex flex-col items-center justify-center text-center p-8 md:p-16 border border-dashed border-slate-200 rounded-xl bg-slate-50/50", className)}>
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 border border-slate-100">
        <DisplayIcon className="w-8 h-8 text-slate-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-brand-navy mb-2">{title}</h3>
      
      {description && (
        <div className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          {description}
        </div>
      )}
      
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
