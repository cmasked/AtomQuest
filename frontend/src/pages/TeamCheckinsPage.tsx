import { useEffect, useState } from 'react';
import { getGoalCheckins, saveCheckin } from '@/api/checkins';
import { getTeamGoals } from '@/api/goals';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, ChevronDown, ChevronRight, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';

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
        <EmptyState icon={Inbox} title="No approved goals found for your team." />
      ) : (
        <Tabs value={selectedQuarter} onValueChange={setSelectedQuarter}>
          <TabsList>
            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <TabsTrigger key={q} value={q}>{q}</TabsTrigger>)}
          </TabsList>
          
          <TabsContent value={selectedQuarter} className="mt-6 space-y-4">
            {teamGoals.map(emp => (
              <div key={emp.name} className="border border-slate-200 rounded-lg">
                <button onClick={() => toggleEmp(emp.name)} className="w-full flex items-center justify-between p-4 bg-slate-50 font-medium">
                  {emp.name}
                  {expandedEmployees[emp.name] ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5" />}
                </button>
                {expandedEmployees[emp.name] && (
                  <div className="p-4 space-y-4">
                    {emp.goals.map((g: any) => {
                      const goalComments = comments[g.id] || [];
                      const quarterComment = goalComments.find((c: any) => c.quarter === selectedQuarter);
                      const isEditing = editing[g.id];
                      
                      return (
                        <div key={g.id} className="border border-slate-100 p-4 rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{g.title}</span>
                              <Badge variant="secondary" className="text-xs">{g.thrustArea}</Badge>
                            </div>
                            <div>
                              {quarterComment && !isEditing ? (
                                <div className="flex items-center gap-3">
                                  <span className="text-green-600 flex items-center gap-1 text-sm"><CheckCircle2 className="w-4 h-4"/> Comment saved</span>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    setEditing(prev => ({ ...prev, [g.id]: true }));
                                    setDrafts(prev => ({ ...prev, [g.id]: quarterComment.comment }));
                                  }}>Edit</Button>
                                </div>
                              ) : !isEditing && (
                                <Button variant="outline" className="border-brand-orange text-brand-orange hover:bg-brand-orange/10" size="sm" onClick={() => setEditing(prev => ({ ...prev, [g.id]: true }))}>
                                  + Add Check-in
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {isEditing && (
                            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                              <Textarea 
                                placeholder="Write your check-in comment..." 
                                value={drafts[g.id] || ''} 
                                onChange={e => setDrafts(prev => ({ ...prev, [g.id]: e.target.value }))}
                              />
                              <div className="flex items-center gap-2">
                                <Button className="bg-brand-orange text-white" onClick={() => handleSave(g.id)}>Save Comment</Button>
                                <Button variant="ghost" onClick={() => setEditing(prev => ({ ...prev, [g.id]: false }))}>Cancel</Button>
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
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}