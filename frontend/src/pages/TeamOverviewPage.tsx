import { useEffect, useState } from 'react';
import { getTeamGoals } from '@/api/goals';
import { useCycleStore } from '@/store/cycleStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronRight, Clock, Loader2, Users, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmployeeGoalDrawer } from './components/EmployeeGoalDrawer';
import type { Goal } from '@/components/ui/GoalCard';
import { cn } from '@/lib/utils';

export default function TeamOverviewPage() {
  const { activeCycle } = useCycleStore();
  const [teamData, setTeamData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('GOAL_SETTING');
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{name: string, goals: Goal[]} | null>(null);

  useEffect(() => {
    if (activeCycle) {
      setSelectedQuarter(activeCycle.phase);
    }
    fetchTeamGoals();
  }, [activeCycle]);

  useEffect(() => {
    document.title = 'Team Overview | AtomQuest';
  }, []);

  const fetchTeamGoals = async () => {
    setIsLoading(true);
    try {
      const data = await getTeamGoals();
      // data.team is an array of users with their goals included
      setTeamData(data.team);
    } catch (err) {
      toast.error('Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  };

  const getGoalStats = (goals: any[]) => {
    const approved = goals.filter(g => g.status === 'APPROVED').length;
    const pending = goals.filter(g => g.status === 'SUBMITTED').length;
    
    // Calculate average score for the selected quarter
    let totalScore = 0;
    let scoredWeight = 0;
    
    goals.forEach(g => {
      if (g.status !== 'APPROVED') return;
      const ach = g.achievements?.find((a: any) => a.quarter === selectedQuarter);
      if (ach && ach.computedScore !== null) {
        totalScore += ach.computedScore * (g.weightage / 100);
        scoredWeight += (g.weightage / 100);
      }
    });
    
    const avgScore = scoredWeight > 0 ? Math.round(totalScore / scoredWeight) : 0;
    
    // Check if checkin exists for this quarter
    const checkinDone = goals.some(g => 
      g.achievements?.some((a: any) => a.quarter === selectedQuarter && a.managerComment)
    );

    return { approved, pending, avgScore, checkinDone };
  };

  const openDrawer = (employee: any) => {
    setSelectedEmployee({
      name: employee.name,
      goals: employee.goals
    });
    setDrawerOpen(true);
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
        title={`My Team — ${activeCycle?.name}`} 
        subtitle={`${teamData.length} direct reports`}
      />

      {/* Quick stats */}
      <div className="flex flex-wrap items-center gap-6 mt-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {teamData.length}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Direct Reports
          </div>
        </div>
        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">
            {teamData.reduce((sum, emp) => sum + getGoalStats(emp.goals).pending, 0)}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Pending Approval
          </div>
        </div>
        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {teamData.reduce((sum, emp) => sum + getGoalStats(emp.goals).approved, 0)}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Goals Approved
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
          {['GOAL_SETTING', 'Q1', 'Q2', 'Q3', 'Q4'].map(q => (
            <button
              key={q}
              onClick={() => setSelectedQuarter(q)}
              className={cn(
                "px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                selectedQuarter === q
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {q === 'GOAL_SETTING' ? 'Goal Setting' : q}
            </button>
          ))}
        </div>

        <div className="space-y-6 outline-none mt-0">
          {teamData.length > 0 ? (
            <div className="flex flex-col gap-4">
              {teamData.map(emp => {
                const stats = getGoalStats(emp.goals);

                return (
                  <Card key={emp.id} className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                    {/* Top accent bar based on pending status */}
                    {stats.pending > 0 && (
                      <div className="h-1 w-full bg-amber-400" />
                    )}
                    
                    <div className="p-6">
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-4">
                          {/* Avatar with brand orange */}
                          <div className="w-12 h-12 rounded-full bg-brand-orange/10 border-2 border-brand-orange/30 flex items-center justify-center shrink-0">
                            <span className="text-lg font-bold text-brand-orange">
                              {emp.name.charAt(0)}
                            </span>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                              {emp.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                {emp.department}
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">·</span>
                              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                {emp.role}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {stats.pending > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {stats.pending} Pending Approval
                          </span>
                        ) : stats.approved > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                            ✓ All Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500">
                            No Goals Yet
                          </span>
                        )}
                      </div>
                      
                      {/* Stats row — 3 mini stat chips */}
                      <div className="flex flex-wrap items-center gap-3 mb-5">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {stats.approved} Approved
                          </span>
                        </div>
                        
                        {stats.pending > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                              {stats.pending} Pending
                            </span>
                          </div>
                        )}
                        
                        {selectedQuarter !== 'GOAL_SETTING' && stats.avgScore > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                              {stats.avgScore}% Avg Score
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Progress bar — only for quarterly tabs */}
                      {selectedQuarter !== 'GOAL_SETTING' && (
                        <div className="mb-5">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-500 dark:text-slate-400">
                              {selectedQuarter} Progress
                            </span>
                            <span className={cn(
                              "font-semibold",
                              stats.avgScore >= 80 ? "text-green-600" :
                              stats.avgScore >= 50 ? "text-amber-600" : "text-red-600"
                            )}>
                              {stats.avgScore}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-700",
                                stats.avgScore >= 80 ? "bg-green-500" :
                                stats.avgScore >= 50 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${Math.min(stats.avgScore, 100)}%` }}
                            />
                          </div>
                          
                          {/* Check-in status */}
                          <div className="flex items-center gap-1.5 mt-2">
                            {stats.checkinDone ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  {selectedQuarter} check-in complete
                                </span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  {selectedQuarter} check-in pending
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* CTA Button */}
                      <Button
                        variant="outline"
                        className="w-full justify-between border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-orange hover:text-brand-orange dark:hover:border-brand-orange dark:hover:text-brand-orange group transition-colors"
                        onClick={() => openDrawer(emp)}
                      >
                        <span className="font-medium">View Goals</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                No direct reports found
              </h3>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Employees will appear here once they are assigned to you in the system.
              </p>
            </div>
          )}
        </div>
      </div>

      <EmployeeGoalDrawer 
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        employeeName={selectedEmployee?.name || ''}
        goals={selectedEmployee?.goals || []}
      />
    </div>
  );
}
