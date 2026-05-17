import { useEffect, useState } from 'react';
import { getGoalCheckins } from '@/api/checkins';
import { getMyGoals } from '@/api/goals';
import { PageHeader } from '@/components/shared/PageHeader';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Loader2, MessageSquare } from 'lucide-react';
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


  return (
    <div className="space-y-6">
      <PageHeader title="Check-in History" />

      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
          <button
            key={q}
            onClick={() => setSelectedQuarter(q)}
            className={cn(
              "px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              selectedQuarter === q
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700"
            )}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {quarterHistory.length > 0 ? (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />
            
            <div className="space-y-6 pl-12">
              {quarterHistory.map(item => (
                <div key={item.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-8 top-2 w-3.5 h-3.5 rounded-full bg-brand-orange border-2 border-white dark:border-slate-950 shadow-sm shadow-orange-200" />
                  
                  {/* Quarter + Date */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-brand-orange/10 text-brand-orange text-xs font-bold">
                      {item.quarter}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-600">
                      {format(new Date(item.createdAt), 'd MMM yyyy')}
                    </span>
                  </div>
                  
                  {/* Goal title */}
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">
                    {item.goalTitle}
                  </h4>
                  
                  {/* Comment card */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
                    <div className="flex gap-3">
                      {/* Manager avatar */}
                      <div className="w-8 h-8 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-brand-orange">
                          {item.managerName?.charAt(0) || 'M'}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {item.managerName || 'Your Manager'}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.comment}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
              No check-ins for {selectedQuarter}
            </h3>
            <p className="text-sm text-slate-400 max-w-xs">
              Your manager's feedback will appear here after your quarterly review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
