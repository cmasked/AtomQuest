import { StatusBadge } from './StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CornerDownLeft, Lock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  weightage: number;
  thrustArea: string;
  uomType: string;
  targetValue: number | null;
  targetDate: string | null;
}

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function GoalCard({ goal, onEdit, onDelete, showActions = true }: GoalCardProps) {
  const isReturned = goal.status === 'RETURNED';
  const isApproved = goal.status === 'APPROVED';
  const isSubmitted = goal.status === 'SUBMITTED';
  const isDraft = goal.status === 'DRAFT';

  const uomLabel = () => {
    switch (goal.uomType) {
      case 'NUMERIC_MIN': return 'Numeric (Higher Better)';
      case 'NUMERIC_MAX': return 'Numeric (Lower Better)';
      case 'TIMELINE': return 'Timeline';
      case 'ZERO': return 'Zero Based';
      default: return goal.uomType;
    }
  };

  const formatDate = (value?: string | Date | null) => {
    if (!value) return '';
    return format(new Date(value), 'dd MMM yyyy');
  };

  return (
    <Card className={cn(
      "bg-white dark:bg-slate-900 transition-all duration-200",
      "border border-slate-200 dark:border-slate-700",
      "shadow-sm hover:shadow-md hover:-translate-y-0.5",
      isReturned  && "border-l-4 border-l-red-500",
      isSubmitted && "border-l-4 border-l-amber-500",
      isApproved  && "border-l-4 border-l-green-500",
      isDraft     && "border-l-4 border-l-slate-300 dark:border-l-slate-600"
    )}>
      <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
        <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          {isApproved && <Lock className="w-4 h-4 text-green-600 shrink-0" />}
          <span className="line-clamp-2">{goal.title}</span>
        </CardTitle>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <StatusBadge status={goal.status} />
          {showActions && (isDraft || isReturned) && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-brand-orange"
                aria-label="Edit goal"
                onClick={() => onEdit?.(goal)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-red-600"
                aria-label="Delete goal"
                onClick={() => onDelete?.(goal.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isReturned && (
          <div className="mb-4 p-3.5 rounded-lg border bg-red-50 border-red-100 dark:bg-red-950/40 dark:border-red-900/50 flex items-start gap-2.5">
            <CornerDownLeft className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-300">
              <span className="font-semibold block mb-0.5">Returned for revision</span>
              <span className="opacity-80">
                Please revise your goal based on feedback and resubmit.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1.5">
              Thrust Area
            </p>
            <div>
              <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                {goal.thrustArea}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1.5">
              Type
            </p>
            <div>
              <span className="inline-flex px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400">
                {uomLabel()}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1.5">
              Target
            </p>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {goal.uomType === 'TIMELINE' && goal.targetDate ? formatDate(goal.targetDate) : (goal.targetValue ?? '—')}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1.5">
              Weightage
            </p>
            <div>
              <span className="text-sm font-bold text-brand-orange">
                {goal.weightage}%
              </span>
            </div>
          </div>
        </div>

        {goal.description && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-600 whitespace-pre-wrap dark:text-slate-400">{goal.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
