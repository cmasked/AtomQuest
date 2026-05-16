import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface WeightageBarProps {
  used: number;
  total?: number;
}

export function WeightageBar({ used, total = 100 }: WeightageBarProps) {
  const percentage = Math.min((used / total) * 100, 100);
  
  let colorClass = "bg-blue-500";
  if (used === total) colorClass = "bg-green-500";
  else if (used > total) colorClass = "bg-red-500";

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500 ease-out", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {used === total && (
        <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
          <CheckCircle2 className="w-3 h-3" />
          <span>Weightage complete</span>
        </div>
      )}
      {used > total && (
        <div className="text-red-500 text-xs font-medium">
          Exceeds maximum weightage
        </div>
      )}
    </div>
  );
}
