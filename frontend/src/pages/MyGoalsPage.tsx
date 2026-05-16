import { useEffect, useState, useMemo } from 'react';
import { getMyGoals, deleteGoal, submitGoal } from '@/api/goals';
import { useCycleStore } from '@/store/cycleStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { GoalCard } from '@/components/ui/GoalCard';
import type { Goal } from '@/components/ui/GoalCard';
import { WeightageBar } from '@/components/ui/WeightageBar';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, Plus, SendHorizontal, Target } from 'lucide-react';
import { GoalDrawer } from './components/GoalDrawer';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

export default function MyGoalsPage() {
  const { activeCycle } = useCycleStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const data = await getMyGoals();
      setGoals(data.goals);
    } catch (err) {
      toast.error('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [activeCycle]);

  useEffect(() => {
    document.title = 'My Goals | AtomQuest';
  }, []);

  const totalWeightage = useMemo(() => {
    return goals.reduce((sum, g) => sum + g.weightage, 0);
  }, [goals]);

  const availableWeightage = 100 - totalWeightage;
  const canSubmit = totalWeightage === 100 && goals.length > 0 && goals.every(g => g.status === 'DRAFT' || g.status === 'RETURNED');
  
  const hasDraftsOrReturned = goals.some(g => g.status === 'DRAFT' || g.status === 'RETURNED');
  const isGoalSettingOpen = activeCycle?.phase === 'GOAL_SETTING';

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;
    try {
      await deleteGoal(id);
      toast.success("Goal deleted");
      fetchGoals();
    } catch (err) {
      toast.error("Failed to delete goal");
    }
  };

  const handleSubmitAll = async () => {
    if (totalWeightage !== 100) {
      toast.error("Total weightage must equal 100% to submit");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // The API only has an endpoint to submit individual goals.
      // We will loop through and submit all DRAFT/RETURNED goals.
      const goalsToSubmit = goals.filter(g => g.status === 'DRAFT' || g.status === 'RETURNED');
      
      for (const goal of goalsToSubmit) {
        await submitGoal(goal.id);
      }
      
      toast.success("All goals submitted for approval");
      fetchGoals();
    } catch (err) {
      toast.error("Failed to submit goals");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddDrawer = () => {
    setEditingGoal(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (goal: Goal) => {
    setEditingGoal(goal);
    setIsDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  // Calculate days remaining if in GOAL_SETTING phase
  const getDaysRemaining = () => {
    if (!activeCycle?.closesAt) return null;
    const closes = new Date(activeCycle.closesAt);
    const now = new Date();
    const diff = Math.ceil((closes.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const daysRemaining = getDaysRemaining();
  const formatDate = (value?: string | Date | null) => {
    if (!value) return '';
    return format(new Date(value), 'dd MMM yyyy');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`My Goals — ${activeCycle?.name || 'Loading...'}`} 
        subtitle={
          <div className="flex items-center gap-2">
            <span>{activeCycle?.phase.replaceAll('_', ' ')} Phase</span>
            {activeCycle && (
              <span className="text-slate-400">
                ({formatDate(activeCycle.opensAt)} – {formatDate(activeCycle.closesAt)})
              </span>
            )}
          </div>
        }
      />

      {isGoalSettingOpen && daysRemaining !== null && (
        <div className={`p-3 text-sm font-medium rounded-lg border flex items-center justify-center gap-2 ${
          daysRemaining <= 3 ? 'bg-red-50 text-red-700 border-red-200' : 
          daysRemaining <= 14 ? 'bg-amber-50 text-amber-700 border-amber-200' : 
          'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          <Clock className="w-4 h-4" />
          Goal Setting window closes in {daysRemaining} days — {formatDate(activeCycle!.closesAt)}
        </div>
      )}

      {/* Persistent Tracker Header Card */}
      <Card className="p-5 sticky top-4 z-10 shadow-sm border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-6">
            <div className="shrink-0 w-32 font-medium text-brand-navy">
              Weightage: {totalWeightage}%
            </div>
            <div className="flex-1 max-w-md">
              <WeightageBar used={totalWeightage} total={100} />
            </div>
            <div className="shrink-0 text-sm text-slate-500 font-medium">
              {goals.length} of 8 goals
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {isGoalSettingOpen && (
              <Button 
                onClick={openAddDrawer}
                disabled={totalWeightage >= 100 || goals.length >= 8}
                variant="outline"
                className="border-brand-orange text-brand-orange hover:bg-brand-orange/10"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Goal
              </Button>
            )}
            
            {hasDraftsOrReturned && (
              <div title={!canSubmit ? "Total weightage must equal 100% to submit" : ""}>
                <Button 
                  onClick={handleSubmitAll}
                  disabled={!canSubmit || isSubmitting}
                  className={canSubmit ? "bg-brand-orange hover:bg-brand-orange/90 text-white animate-pulse" : "bg-slate-200 text-slate-500"}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <SendHorizontal className="w-4 h-4 mr-2" />}
                  Submit All Goals
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Goal Cards List */}
      {goals.length > 0 ? (
        <div className="flex flex-col gap-4">
          {goals.map(goal => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              onEdit={openEditDrawer} 
              onDelete={handleDelete}
              showActions={isGoalSettingOpen}
            />
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Target}
          title={`No goals yet for ${activeCycle?.name}`}
          description={
            <>
              <p>The goal setting window is open until {activeCycle ? formatDate(activeCycle.closesAt) : 'the deadline'}.</p>
              <p className="mt-1">Start by adding your first goal.</p>
            </>
          }
          actionLabel="+ Add your first goal"
          onAction={openAddDrawer}
        />
      )}

      <GoalDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        goal={editingGoal} 
        onSuccess={fetchGoals}
        availableWeightage={availableWeightage}
      />
    </div>
  );
}
