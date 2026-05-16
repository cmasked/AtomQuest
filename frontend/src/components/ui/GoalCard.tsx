import { StatusBadge } from './StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      "transition-all duration-200",
      isReturned ? "border-red-300 shadow-sm" : "hover:shadow-md",
      isSubmitted ? "border-l-4 border-l-amber-400" : ""
    )}>
      <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-semibold text-brand-navy flex items-center gap-2">
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
          <div className="mb-4 p-3 bg-red-50 text-red-800 text-sm rounded-md border border-red-100 flex items-start gap-2">
            <CornerDownLeft className="w-4 h-4 mt-0.5 text-red-600" />
            <div>
              <span className="font-semibold block mb-1">Returned by manager</span>
              <span className="opacity-90">Please revise your goal based on feedback and resubmit.</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
          <div>
            <span className="block text-slate-500 text-xs mb-1">Thrust Area</span>
            <Badge variant="secondary" className="font-normal">{goal.thrustArea}</Badge>
          </div>
          <div>
            <span className="block text-slate-500 text-xs mb-1">Type</span>
            <Badge variant="outline" className="font-normal text-slate-600">{uomLabel()}</Badge>
          </div>
          <div>
            <span className="block text-slate-500 text-xs mb-1">Target</span>
            <span className="font-medium text-slate-800">
              {goal.uomType === 'TIMELINE' && goal.targetDate ? formatDate(goal.targetDate) : (goal.targetValue ?? '—')}
            </span>
          </div>
          <div>
            <span className="block text-slate-500 text-xs mb-1">Weightage</span>
            <span className="font-semibold text-brand-navy">{goal.weightage}%</span>
          </div>
        </div>

        {goal.description && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{goal.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
