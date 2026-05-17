import { useEffect, useState } from 'react';
import { getGoalCheckins, saveCheckin } from '@/api/checkins';
import { getTeamGoals } from '@/api/goals';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, ChevronDown, ChevronRight, Inbox, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function TeamCheckinsPage() {
  const [teamGoals, setTeamGoals] = useState<any[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, any>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTeamGoals();
  }, []);

  const fetchTeamGoals = async () => {
    try {
      const data = await getTeamGoals();
      const approvedOnly = data.team.map((emp: any) => ({
        ...emp,
        goals: emp.goals.filter((g: any) => g.status === 'APPROVED')
      })).filter((emp: any) => emp.goals.length > 0);
      setTeamGoals(approvedOnly);
      
      const initialExpanded: Record<string, boolean> = {};
      approvedOnly.forEach((emp: any) => initialExpanded[emp.name] = true);
      setExpandedEmployees(initialExpanded);

      approvedOnly.forEach((emp: any) => {
        emp.goals.forEach((g: any) => {
          fetchComments(g.id);
        });
      });
    } catch {
      toast.error('Failed to fetch team goals');
    }
  };

  const fetchComments = async (goalId: string) => {
    try {
      const data = await getGoalCheckins(goalId);
      setComments(prev => ({ ...prev, [goalId]: data.checkins || [] }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (goalId: string) => {
    const comment = drafts[goalId];
    if (!comment) return;
    try {
      await saveCheckin({ goalId, quarter: selectedQuarter, comment });
      toast.success('Check-in saved');
      setEditing(prev => ({ ...prev, [goalId]: false }));
      fetchComments(goalId);
    } catch {
      toast.error('Failed to save check-in');
    }
  };

  const toggleEmp = (name: string) => setExpandedEmployees(prev => ({ ...prev, [name]: !prev[name] }));

  return (
    <div className="space-y-6">
      <PageHeader title="Team Check-ins" />
      
      {teamGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
            <Inbox className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No active goals
          </h3>
          <p className="text-sm text-slate-400 max-w-xs">
            Your team does not have any approved goals for check-ins yet.
          </p>
        </div>
      ) : (
        <>
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
          
          <div className="space-y-4">
            {teamGoals.map(emp => (
              <div key={emp.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-all duration-200">
                <button onClick={() => toggleEmp(emp.name)} 
                  className={cn(
                    "w-full flex items-center justify-between p-5 transition-colors",
                    expandedEmployees[emp.name] ? "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-orange/10 border-2 border-brand-orange/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-brand-orange">
                        {emp.name.charAt(0)}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{emp.name}</div>
                      <div className="text-xs text-slate-500">{emp.goals.length} active goals</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    {expandedEmployees[emp.name] ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>
                
                {expandedEmployees[emp.name] && (
                  <div className="p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900">
                    {emp.goals.map((g: any) => {
                      const goalComments = comments[g.id] || [];
                      const quarterComment = goalComments.find((c: any) => c.quarter === selectedQuarter);
                      const isEditing = editing[g.id];
                      
                      return (
                        <div key={g.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-xl shadow-sm">
                          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                                  {g.thrustArea}
                                </span>
                              </div>
                              <span className="font-semibold text-slate-900 dark:text-white block">{g.title}</span>
                            </div>
                            <div className="shrink-0 mt-1 md:mt-0">
                              {quarterComment && !isEditing ? (
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold border border-green-200 dark:border-green-800/50">
                                    <CheckCircle2 className="w-3.5 h-3.5"/> 
                                    Comment Saved
                                  </span>
                                  <Button variant="ghost" size="sm" 
                                    className="text-slate-500 hover:text-brand-orange h-8"
                                    onClick={() => {
                                      setEditing(prev => ({ ...prev, [g.id]: true }));
                                      setDrafts(prev => ({ ...prev, [g.id]: quarterComment.comment }));
                                    }}>
                                    Edit
                                  </Button>
                                </div>
                              ) : !isEditing && (
                                <Button variant="outline" size="sm" 
                                  className="border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white transition-colors h-8" 
                                  onClick={() => setEditing(prev => ({ ...prev, [g.id]: true }))}>
                                  + Add Check-in
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {quarterComment && !isEditing && (
                            <div className="mt-3 p-3.5 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/30 flex gap-3 text-sm">
                              <MessageSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              <div className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                "{quarterComment.comment}"
                              </div>
                            </div>
                          )}
                          
                          {isEditing && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                              <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 block">
                                Manager feedback for {selectedQuarter}
                              </label>
                              <Textarea 
                                placeholder="Write your check-in comment..." 
                                value={drafts[g.id] || ''} 
                                onChange={e => setDrafts(prev => ({ ...prev, [g.id]: e.target.value }))}
                                className="min-h-[100px] mb-3 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600 resize-none"
                              />
                              <div className="flex items-center gap-2">
                                <Button size="sm" 
                                  className="bg-brand-orange hover:bg-orange-600 text-white font-medium shadow-sm shadow-orange-200 dark:shadow-none" 
                                  onClick={() => handleSave(g.id)}>
                                  Save Comment
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditing(prev => ({ ...prev, [g.id]: false }))}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}