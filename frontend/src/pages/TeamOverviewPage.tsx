import { useEffect, useState } from 'react';
import { getTeamGoals } from '@/api/goals';
import { useCycleStore } from '@/store/cycleStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, ChevronRight, Clock, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmployeeGoalDrawer } from './components/EmployeeGoalDrawer';
import type { Goal } from '@/components/ui/GoalCard';

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

      <Tabs value={selectedQuarter} onValueChange={setSelectedQuarter} className="w-full">
        <TabsList className="mb-6 bg-transparent border-b border-border w-full justify-start rounded-none p-0 h-auto">
          {['GOAL_SETTING', 'Q1', 'Q2', 'Q3', 'Q4'].map(q => (
            <TabsTrigger 
              key={q} 
              value={q}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-orange data-[state=active]:text-brand-orange data-[state=active]:bg-transparent px-6 py-3"
            >
              {q === 'GOAL_SETTING' ? 'Goal Setting' : q}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedQuarter} className="space-y-6 outline-none mt-0">
          {teamData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {teamData.map(emp => {
                const stats = getGoalStats(emp.goals);
                
                let progressColor = "bg-blue-500";
                if (stats.avgScore >= 80) progressColor = "bg-green-500";
                else if (stats.avgScore >= 50) progressColor = "bg-amber-500";
                else if (stats.avgScore > 0) progressColor = "bg-red-500";

                return (
                  <Card key={emp.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-brand-navy">{emp.name}</h3>
                            <div className="text-sm text-slate-500">{emp.department || 'No Dept'} · {emp.role}</div>
                          </div>
                        </div>
                        {stats.pending > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none shrink-0">
                            {stats.pending} Pending Approval
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-4 mb-5">
                        <div className="text-sm text-slate-600">
                          Goals: {stats.approved} approved{stats.pending > 0 ? `, ${stats.pending} pending` : ''}
                        </div>
                        
                        {selectedQuarter !== 'GOAL_SETTING' && (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${progressColor}`} 
                                  style={{ width: `${Math.min(stats.avgScore, 100)}%` }} 
                                />
                              </div>
                              <span className="text-sm font-medium w-24 text-right">
                                {stats.avgScore}% avg score
                              </span>
                            </div>

                            <div className="text-sm">
                              {selectedQuarter} Check-in:{' '}
                              {stats.checkinDone ? (
                                <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Done
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-400">
                                  <Clock className="w-4 h-4" />
                                  Pending
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <Button 
                        variant="ghost" 
                        className="w-full justify-between text-brand-orange hover:text-brand-orange hover:bg-brand-orange/5"
                        onClick={() => openDrawer(emp)}
                      >
                        View Goals
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState 
              icon={Users}
              title="No direct reports found"
              description="You don't have any employees assigned to you yet."
            />
          )}
        </TabsContent>
      </Tabs>

      <EmployeeGoalDrawer 
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        employeeName={selectedEmployee?.name || ''}
        goals={selectedEmployee?.goals || []}
      />
    </div>
  );
}
