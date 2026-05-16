import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { GoalCard } from '@/components/ui/GoalCard';
import type { Goal } from '@/components/ui/GoalCard';

interface EmployeeGoalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  goals: Goal[];
}

export function EmployeeGoalDrawer({ isOpen, onClose, employeeName, goals }: EmployeeGoalDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" side="right">
        <SheetHeader className="mb-6">
          <SheetTitle>{employeeName}'s Goals</SheetTitle>
          <SheetDescription>
            Goal sheet for the current cycle.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {goals.length > 0 ? (
            goals.map(goal => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                showActions={false}
              />
            ))
          ) : (
            <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No goals found for this employee.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
