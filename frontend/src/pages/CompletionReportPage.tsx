import { useState, useEffect } from 'react';
import { getCompletionDashboard } from '@/api/reports';
import { getCheckinCompletion } from '@/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

export default function CompletionReportPage() {
  const [tab, setTab] = useState('GOAL_SETTING');
  const [goalData, setGoalData] = useState<any>(null);
  const [qData, setQData] = useState<any[]>([]);

  useEffect(() => {
    if (tab === 'GOAL_SETTING') {
      getCompletionDashboard().then(res => setGoalData(res.goalSettingCompletion)).catch(console.error);
    } else {
      getCheckinCompletion(tab).then(res => setQData(res.completion || [])).catch(console.error);
    }
  }, [tab]);

  return (
    <div className="space-y-6">
      <PageHeader title="Completion Report" />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="GOAL_SETTING">Goal Setting</TabsTrigger>
          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <TabsTrigger key={q} value={q}>{q}</TabsTrigger>)}
        </TabsList>
        
        <div className="mt-6">
          {tab === 'GOAL_SETTING' && goalData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Total', value: goalData.totalEmployees },
                  { label: 'Approved', value: goalData.approved },
                  { label: 'Submitted', value: goalData.submitted },
                  { label: 'Draft', value: goalData.draft },
                  { label: 'Returned', value: goalData.returned },
                ].map((s, i) => (
                  <Card key={i} className="p-4 text-center">
                    <div className="text-2xl font-bold">{s.value || 0}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest">{s.label}</div>
                  </Card>
                ))}
              </div>
              <Card className="p-6">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Approval Rate</span>
                  <span className="font-bold">{goalData.approvalRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div className={`h-full ${goalData.approvalRate < 50 ? 'bg-red-500' : goalData.approvalRate < 80 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${goalData.approvalRate}%` }} />
                </div>
              </Card>
            </div>
          )}

          {tab !== 'GOAL_SETTING' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-slate-500">Total Managers</div>
                  <div className="text-2xl font-bold">{qData.length}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-slate-500">Avg Completion %</div>
                  <div className="text-2xl font-bold">
                    {qData.length ? Math.round(qData.reduce((s, x) => s + (x.completionRate || 0), 0) / qData.length) : 0}%
                  </div>
                </Card>
              </div>
              
              <div className="border rounded-lg bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr><th className="p-3 text-left">Manager</th><th className="p-3 text-left">Team Size</th><th className="p-3 text-left">Done</th><th className="p-3 text-left">Completion %</th><th className="p-3 text-left">Pending</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {[...qData].sort((a,b) => (a.completionRate||0) - (b.completionRate||0)).map((row, i) => (
                      <tr key={i}>
                        <td className="p-3 font-medium">{row.managerName}</td>
                        <td className="p-3">{row.teamSize}</td>
                        <td className="p-3">{row.completed}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-brand-orange" style={{ width: `${row.completionRate}%` }} /></div>
                            <span>{row.completionRate}%</span>
                          </div>
                        </td>
                        <td className="p-3 flex flex-wrap gap-1">
                          {(row.pendingEmployees || []).map((e: any, j: number) => (
                            <div key={j} className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center cursor-help" title={e.name}>
                              {e.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}