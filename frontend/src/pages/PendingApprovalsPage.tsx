import { useEffect, useMemo, useState } from 'react';
import { approveGoal, getTeamGoals, returnGoal } from '@/api/goals';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

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
                className={`p-5 border-l-4 border-l-amber-400 shadow-sm transition-all duration-300 ${
                  isRemoving ? 'opacity-0 translate-y-1' : 'opacity-100'
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-slate-200 bg-slate-100">
                            <AvatarFallback className="text-slate-600">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-slate-600">{goal.employeeName}</div>
                            <h3 className="text-lg font-semibold text-brand-navy">{goal.title}</h3>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">{getSubmittedText(goal)}</div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="secondary" className="bg-slate-100 font-normal">
                          Thrust: {goal.thrustArea}
                        </Badge>
                        <Badge variant="outline" className="font-normal text-slate-600">
                          UoM: {goal.uomType.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="font-normal text-slate-600">
                          Weight: {goal.weightage}%
                        </Badge>
                        <Badge variant="outline" className="font-normal text-slate-600 border-dashed">
                          Target: {goal.uomType === 'TIMELINE' ? (goal.targetDate ? formatDate(goal.targetDate) : 'N/A') : (goal.targetValue ?? 'N/A')}
                        </Badge>
                      </div>

                      {goal.description && (
                        <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-600">
                          {goal.description}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col gap-3 shrink-0">
                      <Button
                        onClick={() => handleApprove(goal.id)}
                        disabled={isProcessing === goal.id}
                        className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
                      >
                        {isProcessing === goal.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Approve
                      </Button>
                      <Button
                        onClick={() => setReturningGoalId(showReturnForm ? null : goal.id)}
                        disabled={isProcessing === goal.id}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 min-w-[140px]"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Return
                      </Button>
                    </div>
                  </div>

                  {showReturnForm && (
                    <div className="mt-2 border-t border-slate-100 pt-4">
                      <Label htmlFor={`return-note-${goal.id}`}>Reason for returning (optional)</Label>
                      <Textarea
                        id={`return-note-${goal.id}`}
                        placeholder="Provide feedback for the employee"
                        value={returnNotes[goal.id] || ''}
                        onChange={(e) =>
                          setReturnNotes((prev) => ({ ...prev, [goal.id]: e.target.value }))
                        }
                        className="min-h-[90px] mt-2"
                      />
                      <div className="flex items-center gap-2 mt-3">
                        <Button variant="ghost" onClick={() => setReturningGoalId(null)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleReturn(goal.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          disabled={isProcessing !== null}
                        >
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
        <EmptyState
          icon={CheckCircle2}
          title="All caught up"
          description="No goals are waiting for your approval right now."
        />
      )}
    </div>
  );
}
