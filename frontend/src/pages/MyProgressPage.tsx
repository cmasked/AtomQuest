import { useEffect, useState, useMemo } from 'react';
import { getMyAchievementSummary, updateAchievement } from '@/api/achievements';
import { useCycleStore } from '@/store/cycleStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, MessageSquare, Lock, TrendingUp, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
          <button
            key={q}
            onClick={() => setSelectedQuarter(q)}
            className={cn(
              "px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              selectedQuarter === q
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="space-y-6 outline-none mt-0">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                Goals Approved
              </span>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/40">
                <CheckCircle2 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.approved}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                Check-ins Done
              </span>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-900/40">
                <MessageSquare className="w-4.5 h-4.5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.checkins}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                Avg Score
              </span>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-brand-orange/10">
                <TrendingUp className="w-4.5 h-4.5 text-brand-orange" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.avgScore}%
            </div>
          </div>
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
                <div key={goal.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-5 hover:shadow-md transition-all duration-200">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Lock className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                          {goal.thrustArea}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {goal.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-brand-orange">{goal.weightage}%</span>
                      <ScoreRing score={ach.computedScore ?? null} size="md" />
                    </div>
                  </div>
                  
                  {/* Planned vs Actual row */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1">Target</p>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                        {targetDisplay ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1">Actual</p>
                      {isWindowOpen ? (
                        isTimeline ? (
                          <input 
                            type="date"
                            className="w-full text-base font-bold bg-transparent border-b-2 border-brand-orange/30 focus:border-brand-orange outline-none text-slate-800 dark:text-slate-200 pb-0.5"
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
                          <input 
                            type="number"
                            className="w-full text-base font-bold bg-transparent border-b-2 border-brand-orange/30 focus:border-brand-orange outline-none text-slate-800 dark:text-slate-200 pb-0.5"
                            placeholder="Enter value..."
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
                        <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                          {ach.actualValue !== null ? 
                            (isTimeline ? (inputData.actualDate ? format(new Date(inputData.actualDate), 'dd MMM yyyy') : '—') : ach.actualValue) 
                            : '—'}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Status selector */}
                  {isWindowOpen && (
                    <div className="flex flex-wrap gap-2">
                      {['NOT_STARTED', 'ON_TRACK', 'COMPLETED'].map(s => (
                        <button key={s}
                          onClick={() => setInputs(prev => {
                            const goalInputs = prev[goal.id] || {};
                            const quarterInputs = goalInputs[selectedQuarter] || { actualValue: '', actualDate: '', status: 'NOT_STARTED' };
                            return {
                              ...prev,
                              [goal.id]: {
                                ...goalInputs,
                                [selectedQuarter]: { ...quarterInputs, status: s }
                              }
                            };
                          })}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all",
                            inputData.status === s
                              ? s === 'NOT_STARTED' ? "bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200"
                                : s === 'ON_TRACK' ? "bg-green-600 text-white border-green-600"
                                : "bg-blue-600 text-white border-blue-600"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                          )}>
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Manager check-in comment */}
                  {ach.managerComment && (
                    <div className="p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/30 flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                          Manager note — {selectedQuarter}
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                          {ach.managerComment}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isWindowOpen && (
                    <Button 
                      onClick={() => handleSave(goal.id, isTimeline)}
                      disabled={savingId === goal.id}
                      className="w-full bg-brand-orange hover:bg-orange-600 text-white shadow-sm shadow-orange-200 dark:shadow-none font-semibold gap-2">
                      {savingId === goal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Save Achievement
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}
