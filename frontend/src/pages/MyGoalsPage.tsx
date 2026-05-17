import { useEffect, useState, useMemo } from 'react';
import { getMyGoals, deleteGoal, submitGoal } from '@/api/goals';
import { useCycleStore } from '@/store/cycleStore';
import { GoalCard } from '@/components/ui/GoalCard';
import type { Goal } from '@/components/ui/GoalCard';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, Plus, Target, CheckCircle2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoalDrawer } from './components/GoalDrawer';
import toast from 'react-hot-toast';
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          My Goals — {activeCycle?.name || 'Loading...'}
        </h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-orange/10 text-brand-orange text-xs font-semibold">
            {activeCycle?.phase.replaceAll('_', ' ')}
          </span>
          <span className="text-sm text-slate-400 dark:text-slate-500">
            {formatDate(activeCycle?.opensAt)} — {formatDate(activeCycle?.closesAt)}
          </span>
        </div>
      </div>

      {isGoalSettingOpen && daysRemaining !== null && (
        <div className={cn(
          "flex items-center gap-2.5 px-5 py-3.5 rounded-xl border text-sm font-medium",
          daysRemaining <= 3
            ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/50 dark:border-red-800/50 dark:text-red-300"
            : daysRemaining <= 14
            ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/50 dark:border-amber-800/50 dark:text-amber-300"
            : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/50 dark:text-blue-300"
        )}>
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            Goal Setting window closes in <strong>{daysRemaining} days</strong> — {formatDate(activeCycle!.closesAt)}
          </span>
        </div>
      )}

      {/* Persistent Tracker Header Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-5">
        <div className="flex items-center gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Weightage</span>
                <span className={cn("text-xl font-bold",
                  totalWeightage === 100 ? "text-green-600" :
                  totalWeightage > 100 ? "text-red-600" : "text-blue-600"
                )}>
                  {totalWeightage}%
                </span>
                <span className="text-slate-400 text-xs">/ 100%</span>
              </div>
              <span className="text-slate-400 text-xs dark:text-slate-600">{goals.length} of 8 goals</span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={cn(
                "h-full rounded-full transition-all duration-700",
                totalWeightage === 100 ? "bg-green-500" :
                totalWeightage > 100 ? "bg-red-500" :
                totalWeightage >= 90 ? "bg-amber-500" : "bg-blue-500"
              )} style={{ width: `${Math.min(totalWeightage, 100)}%` }} />
            </div>
            {totalWeightage === 100 ? (
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ready to submit — all goals locked in
              </div>
            ) : (
              <p className="text-xs text-slate-400">{100 - totalWeightage}% remaining</p>
            )}
          </div>
          <div className="flex gap-3 shrink-0">
            {isGoalSettingOpen && (
              <Button variant="outline"
                onClick={openAddDrawer}
                disabled={totalWeightage >= 100 || goals.length >= 8}
                className="border-slate-200 dark:border-slate-700 gap-1.5 text-slate-700 dark:text-slate-300 hover:border-brand-orange hover:text-brand-orange dark:hover:border-brand-orange dark:hover:text-brand-orange transition-colors">
                <Plus className="w-4 h-4" /> Add Goal
              </Button>
            )}
            {hasDraftsOrReturned && (
              <Button disabled={totalWeightage !== 100 || goals.length === 0 || isSubmitting}
                onClick={handleSubmitAll}
                className={cn("gap-1.5 font-semibold",
                  totalWeightage === 100 && goals.length > 0 && !isSubmitting
                    ? "bg-brand-orange hover:bg-orange-600 text-white shadow-sm shadow-orange-200 dark:shadow-none"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                )}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit All
              </Button>
            )}
          </div>
        </div>
      </div>

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
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center mb-5">
            <Target className="w-8 h-8 text-brand-orange" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No goals yet
          </h3>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
            The goal setting window is open until {activeCycle ? formatDate(activeCycle.closesAt) : 'the deadline'}. Start by adding your first goal.
          </p>
          <Button onClick={openAddDrawer} className="bg-brand-orange hover:bg-orange-600 text-white shadow-sm shadow-orange-200 dark:shadow-none font-semibold gap-2">
            <Plus className="w-4 h-4" />
            Add your first goal
          </Button>
        </div>
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
