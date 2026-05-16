import { useEffect, useState, useMemo } from 'react';
import { getMyAchievementSummary, updateAchievement } from '@/api/achievements';
import { useCycleStore } from '@/store/cycleStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function MyProgressPage() {
  const { activeCycle } = useCycleStore();
  const [summary, setSummary] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  
  // Local state to manage form inputs before saving
  const [inputs, setInputs] = useState<Record<string, Record<string, { actualValue: string; actualDate: string; status: string }>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeCycle) {
      const q = activeCycle.phase === 'GOAL_SETTING' ? 'Q1' : activeCycle.phase;
      setSelectedQuarter(q);
    }
    fetchSummary();
  }, [activeCycle]);

  useEffect(() => {
    document.title = 'My Progress | AtomQuest';
  }, []);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const data = await getMyAchievementSummary();
      setSummary(data.summary);
      
      // Initialize inputs state, preserving any locally-entered dates
      setInputs((prev) => {
        const next: Record<string, Record<string, { actualValue: string; actualDate: string; status: string }>> = {};
        data.summary.forEach((goal: any) => {
          goal.achievements.forEach((ach: any) => {
            if (!next[goal.id]) next[goal.id] = {};
            const previous = prev?.[goal.id]?.[ach.quarter];
            next[goal.id][ach.quarter] = {
              actualValue: ach.actualValue !== null ? String(ach.actualValue) : '',
              actualDate: previous?.actualDate || '',
              status: ach.progressStatus || 'NOT_STARTED',
            };
          });
        });
        return next;
      });
    } catch (err) {
      toast.error('Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (goalId: string, isTimeline: boolean) => {
    const data = inputs[goalId]?.[selectedQuarter];
    if (!data) return;

    setSavingId(goalId);
    try {
      const payload: { actualValue?: number | null; actualDate?: string | null; progressStatus: string } = {
        progressStatus: data.status,
      };

      if (isTimeline) {
        payload.actualDate = data.actualDate || null;
      } else {
        payload.actualValue = data.actualValue === '' ? null : Number(data.actualValue);
      }

      await updateAchievement(goalId, selectedQuarter, payload);
      toast.success('Achievement updated');
      await fetchSummary(); // Refresh scores and comments
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save achievement');
    } finally {
      setSavingId(null);
    }
  };

  const isWindowOpen = activeCycle?.phase === selectedQuarter;

  const stats = useMemo(() => {
    let checkinsDone = 0;
    let totalScore = 0;
    let scoredGoals = 0;

    summary.forEach(goal => {
      const ach = goal.achievements.find((a: any) => a.quarter === selectedQuarter);
      if (ach) {
        if (ach.managerComment) checkinsDone++;
        if (ach.computedScore !== null) {
          totalScore += ach.computedScore * (goal.weightage / 100);
          scoredGoals += (goal.weightage / 100);
        }
      }
    });

    const avgScore = scoredGoals > 0 ? (totalScore / scoredGoals) : 0;

    return {
      approved: summary.length,
      checkins: checkinsDone,
      avgScore: Math.round(avgScore)
    };
  }, [summary, selectedQuarter]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (summary.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={`My Progress — ${activeCycle?.name || 'Loading...'}`} />
        <EmptyState 
          icon={AlertCircle}
          title="No approved goals found"
          description="Progress tracking is only available for approved goals. Please submit your goals for approval in the 'My Goals' section."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title={`My Progress — ${activeCycle?.name}`} />

      <Tabs value={selectedQuarter} onValueChange={setSelectedQuarter} className="w-full">
        <TabsList className="mb-6 bg-transparent border-b border-border w-full justify-start rounded-none p-0 h-auto">
          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
            <TabsTrigger 
              key={q} 
              value={q}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-orange data-[state=active]:text-brand-orange data-[state=active]:bg-transparent px-6 py-3"
            >
              {q}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedQuarter} className="space-y-6 outline-none mt-0">
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 shadow-sm flex flex-col justify-center">
              <div className="text-sm text-slate-500 mb-1">Goals Approved</div>
              <div className="text-2xl font-semibold text-brand-navy">{stats.approved}</div>
            </Card>
            <Card className="p-4 shadow-sm flex flex-col justify-center">
              <div className="text-sm text-slate-500 mb-1">Check-ins Done</div>
              <div className="text-2xl font-semibold text-brand-navy">{stats.checkins}</div>
            </Card>
            <Card className="p-4 shadow-sm flex flex-col justify-center border-l-4 border-l-brand-orange">
              <div className="text-sm text-slate-500 mb-1">Avg Score (Weighted)</div>
              <div className="text-2xl font-semibold text-brand-navy">{stats.avgScore}%</div>
            </Card>
          </div>

          {!isWindowOpen && (
            <div className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              The achievement entry window for {selectedQuarter} is currently closed.
            </div>
          )}

          {/* Goal Progress Cards */}
          <div className="space-y-6 mt-6">
            {summary.map(goal => {
              const ach = goal.achievements.find((a: any) => a.quarter === selectedQuarter) || {};
              const inputData = inputs[goal.id]?.[selectedQuarter] || { actualValue: '', actualDate: '', status: 'NOT_STARTED' };
              
              const isTimeline = goal.uomType === 'TIMELINE';
              const targetDisplay = isTimeline && goal.targetDate 
                ? format(new Date(goal.targetDate), 'dd MMM yyyy') 
                : goal.targetValue;

              return (
                <Card key={goal.id} className="overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="bg-slate-50/80 px-5 py-4 border-b border-border flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-medium text-brand-navy text-lg">{goal.title}</h3>
                      <div className="flex gap-3 mt-2 text-sm text-slate-500">
                        <span>Weightage: <span className="font-semibold text-slate-700">{goal.weightage}%</span></span>
                        <span>•</span>
                        <span>{goal.uomType.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <StatusBadge status={inputData.status} className="shrink-0" />
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col md:flex-row gap-8">
                    
                    {/* Left: Target & Actual Input */}
                    <div className="flex-1 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Target</label>
                          <div className="text-lg font-medium bg-slate-50 px-3 py-2 rounded border border-slate-100">
                            {targetDisplay}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Actual</label>
                          {isWindowOpen ? (
                            isTimeline ? (
                              <Input 
                                type="date" 
                                value={inputData.actualDate} 
                                onChange={e => setInputs(prev => {
                                  const goalInputs = prev[goal.id] || {};
                                  const quarterInputs = goalInputs[selectedQuarter] || { actualValue: '', actualDate: '', status: 'NOT_STARTED' };
                                  return {
                                    ...prev,
                                    [goal.id]: {
                                      ...goalInputs,
                                      [selectedQuarter]: { ...quarterInputs, actualDate: e.target.value }
                                    }
                                  };
                                })}
                              />
                            ) : (
                              <Input 
                                type="number" 
                                placeholder="Enter value" 
                                value={inputData.actualValue} 
                                onChange={e => setInputs(prev => {
                                  const goalInputs = prev[goal.id] || {};
                                  const quarterInputs = goalInputs[selectedQuarter] || { actualValue: '', actualDate: '', status: 'NOT_STARTED' };
                                  return {
                                    ...prev,
                                    [goal.id]: {
                                      ...goalInputs,
                                      [selectedQuarter]: { ...quarterInputs, actualValue: e.target.value }
                                    }
                                  };
                                })}
                              />
                            )
                          ) : (
                            <div className="text-lg font-medium px-3 py-2">
                              {ach.actualValue !== null ? 
                                (isTimeline ? (inputData.actualDate ? format(new Date(inputData.actualDate), 'dd MMM yyyy') : '—') : ach.actualValue) 
                                : '—'}
                            </div>
                          )}
                        </div>
                      </div>

                      {isWindowOpen && (
                        <div>
                          <label className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2 block">Progress Status</label>
                          <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                            {['NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'COMPLETED'].map(st => (
                              <button
                                key={st}
                                onClick={() => setInputs(prev => {
                                  const goalInputs = prev[goal.id] || {};
                                  const quarterInputs = goalInputs[selectedQuarter] || { actualValue: '', actualDate: '', status: 'NOT_STARTED' };
                                  return {
                                    ...prev,
                                    [goal.id]: {
                                      ...goalInputs,
                                      [selectedQuarter]: { ...quarterInputs, status: st }
                                    }
                                  };
                                })}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                  inputData.status === st 
                                    ? 'bg-white shadow-sm text-brand-orange' 
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {st.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {isWindowOpen && (
                        <div className="pt-2">
                          <Button 
                            onClick={() => handleSave(goal.id, isTimeline)}
                            disabled={savingId === goal.id}
                            className="bg-brand-orange hover:bg-brand-orange/90 text-white"
                          >
                            {savingId === goal.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Achievement
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Right: Score Ring */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-32 md:border-l md:border-border md:pl-8">
                      <ScoreRing score={ach.computedScore} size="lg" />
                      <span className="text-xs text-slate-500 mt-3 font-medium uppercase tracking-wider">Computed Score</span>
                    </div>

                  </div>

                  {/* Manager Comment Section */}
                  <div className="px-5 py-4 bg-slate-50/50 border-t border-border">
                    {ach.managerComment ? (
                      <div className="flex gap-3 text-sm">
                        <MessageSquare className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-slate-700 mb-1">
                            Manager note · {ach.managerName || 'Manager'}
                          </div>
                          <div className="text-slate-600 italic">
                            "{ach.managerComment}"
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 italic">
                        No manager check-in yet for this quarter
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
