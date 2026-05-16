import { Badge } from '@/components/ui/badge';
import { getStatusConfig } from './theme';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "border-transparent whitespace-nowrap",
        config.bg, 
        config.text,
        size === 'sm' ? "px-2 py-0 text-[10px] uppercase tracking-wider" : "px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
