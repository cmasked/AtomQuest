import { useEffect, useMemo, useState } from 'react';
import { approveGoal, getTeamGoals, returnGoal } from '@/api/goals';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface PendingGoal {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  weightage: number;
  thrustArea: string;
  uomType: string;
  targetValue: number | null;
  targetDate: string | null;
  updatedAt?: string;
  createdAt?: string;
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
}

export default function PendingApprovalsPage() {
  const [teamData, setTeamData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [returningGoalId, setReturningGoalId] = useState<string | null>(null);
  const [returnNotes, setReturnNotes] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<string[]>([]);

  useEffect(() => {
    document.title = 'Pending Approvals | AtomQuest';
    fetchTeamGoals();
  }, []);

  const fetchTeamGoals = async () => {
    setIsLoading(true);
    try {
      const data = await getTeamGoals();
      setTeamData(data.team || []);
    } catch (err) {
      toast.error('Failed to load pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const pendingGoals = useMemo<PendingGoal[]>(() => {
    return teamData.flatMap((emp) =>
      (emp.goals || [])
        .filter((g: any) => g.status === 'SUBMITTED')
        .map((g: any) => ({
          ...g,
          employeeId: emp.id,
          employeeName: emp.name,
          employeeEmail: emp.email,
        }))
    );
  }, [teamData]);

  const formatDate = (value?: string | Date | null) => {
    if (!value) return '';
    return format(new Date(value), 'dd MMM yyyy');
  };

  const getSubmittedText = (goal: PendingGoal) => {
    const submittedAt = goal.updatedAt || goal.createdAt;
    if (!submittedAt) return 'Submitted recently';
    return `Submitted ${formatDistanceToNow(new Date(submittedAt), { addSuffix: true })}`;
  };

  const markRemoving = (goalId: string) => {
    setRemovingIds((prev) => (prev.includes(goalId) ? prev : [...prev, goalId]));
  };

  const finalizeRemoval = (goalId: string) => {
    markRemoving(goalId);
    setTimeout(() => {
      fetchTeamGoals();
      setRemovingIds((prev) => prev.filter((id) => id !== goalId));
    }, 350);
  };

  const handleApprove = async (goalId: string) => {
    setIsProcessing(goalId);
    try {
      await approveGoal(goalId);
      toast.success('Goal approved and locked');
      finalizeRemoval(goalId);
    } catch (err) {
      toast.error('Failed to approve goal');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReturn = async (goalId: string) => {
    const note = returnNotes[goalId]?.trim();
    setIsProcessing(goalId);
    try {
      await returnGoal(goalId, note || undefined);
      toast.success('Goal returned to employee');
      setReturningGoalId(null);
      finalizeRemoval(goalId);
    } catch (err) {
      toast.error('Failed to return goal');
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Approvals"
        subtitle={`${pendingGoals.length} goals waiting for your review`}
      />

      {pendingGoals.length > 0 ? (
        <div className="space-y-4">
          {pendingGoals.map((goal) => {
            const initials = goal.employeeName
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('');
            const isRemoving = removingIds.includes(goal.id);
            const showReturnForm = returningGoalId === goal.id;

            return (
              <Card
                key={goal.id}
                className={cn(
                  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-amber-400 transition-all duration-300",
                  isRemoving ? 'opacity-0 translate-y-1' : 'opacity-100'
                )}
              >
                <div className="p-6">
                  {/* Employee row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-orange/10 border-2 border-brand-orange/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-brand-orange">
                          {initials.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-600">
                          {goal.employeeName}
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                          {goal.title}
                        </h3>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{getSubmittedText(goal)}</span>
                  </div>
                  
                  {/* Metadata chips */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {goal.thrustArea}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {goal.uomType.replace('_', ' ')}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {goal.weightage}% weight
                    </span>
                    <span className="px-2.5 py-1 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-500">
                      Target: {goal.uomType === 'TIMELINE' ? (goal.targetDate ? formatDate(goal.targetDate) : 'N/A') : (goal.targetValue ?? 'N/A')}
                    </span>
                  </div>
                  
                  {goal.description && (
                    <div className="mb-4 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {goal.description}
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <Button onClick={() => handleApprove(goal.id)}
                      disabled={isProcessing === goal.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold gap-2">
                      {isProcessing === goal.id 
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <CheckCircle2 className="w-4 h-4" />}
                      Approve
                    </Button>
                    <Button onClick={() => setReturningGoalId(showReturnForm ? null : goal.id)}
                      variant="outline"
                      className="flex-1 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Return
                    </Button>
                  </div>
                  
                  {/* Return form */}
                  {showReturnForm && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 block">
                        Reason for returning
                      </label>
                      <Textarea placeholder="Give the employee clear feedback..."
                        value={returnNotes[goal.id] || ''}
                        onChange={(e) => setReturnNotes((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                        className="min-h-[80px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 resize-none" />
                      <div className="flex gap-2 mt-3">
                        <Button variant="ghost" size="sm" onClick={() => setReturningGoalId(null)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleReturn(goal.id)}
                          className="bg-red-600 hover:bg-red-700 text-white">
                          {isProcessing === goal.id ? 'Processing...' : 'Confirm Return'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            All caught up!
          </h3>
          <p className="text-sm text-slate-400 max-w-xs">
            No goals are waiting for your review right now.
          </p>
        </div>
      )}
    </div>
  );
}
