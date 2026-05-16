import { useEffect, useState } from 'react';
import { getGoalCheckins } from '@/api/checkins';
import { getMyGoals } from '@/api/goals';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Calendar, Loader2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function CheckinHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q1');

  useEffect(() => {
    document.title = 'Check-in History | AtomQuest';
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const goalsResponse = await getMyGoals();
      const goals = goalsResponse.goals || [];

      const commentLists = await Promise.all(
        goals.map(async (goal: any) => {
          const res = await getGoalCheckins(goal.id);
          const comments = res.comments || [];
          return comments.map((comment: any) => ({
            id: comment.id,
            goalId: goal.id,
            goalTitle: goal.title,
            quarter: comment.quarter,
            managerName: comment.manager?.name,
            comment: comment.comment,
            createdAt: comment.createdAt,
          }));
        })
      );

      const flattened = commentLists.flat();
      flattened.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(flattened);
    } catch (err) {
      toast.error('Failed to load check-in history');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  const quarterHistory = history.filter(h => h.quarter === selectedQuarter);
  const formatDate = (value?: string | Date | null) => {
    if (!value) return '';
    return format(new Date(value), 'dd MMM yyyy');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Check-in History" />

      <Tabs value={selectedQuarter} onValueChange={setSelectedQuarter} className="w-full">
        <TabsList className="mb-6 bg-slate-100 rounded-lg p-1">
          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
            <TabsTrigger 
              key={q} 
              value={q}
              className="rounded-md px-6 data-[state=active]:bg-white data-[state=active]:text-brand-orange data-[state=active]:shadow-sm"
            >
              {q}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedQuarter} className="space-y-6">
          {quarterHistory.length > 0 ? (
            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8 py-4">
              {quarterHistory.map((item) => (
                <div key={item.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-brand-orange border-4 border-white shadow-sm" />
                  
                  <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">{item.quarter}</span>
                    <span>•</span>
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  
                  <h4 className="font-medium text-brand-navy mb-3">{item.goalTitle}</h4>
                  
                  <Card className="p-4 bg-slate-50/80 border border-slate-100 shadow-sm">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 mb-1">
                          {item.managerName || 'Your Manager'} commented:
                        </div>
                        <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {item.comment}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={MessageSquare}
              title={`No check-ins for ${selectedQuarter}`}
              description="Your manager's comments will appear here after quarterly reviews."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
