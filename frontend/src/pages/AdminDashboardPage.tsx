import { useState, useEffect } from 'react';
import { getCompletionDashboard } from '@/api/reports';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Users, CheckCircle, Send, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getCompletionDashboard().then(res => setData(res)).catch(console.error);
  }, []);

  if (!data) return <div className="p-8 animate-pulse space-y-6"><div className="h-24 bg-slate-200 rounded-xl" /><div className="h-64 bg-slate-200 rounded-xl" /></div>;

  const stats = data.goalSettingCompletion || { totalEmployees: 0, approved: 0, submissionRate: 0, approvalRate: 0, submitted: 0, returned: 0, draft: 0, totalGoals: 0 };
  
  const pieData = [
    { name: 'Approved', value: stats.approved || 0, fill: '#22C55E' },
    { name: 'Submitted', value: stats.submitted || 0, fill: '#F59E0B' },
    { name: 'Returned', value: stats.returned || 0, fill: '#EF4444' },
    { name: 'Draft', value: stats.draft || 0, fill: '#94A3B8' },
  ];

  const barData = Object.entries(data.quarterlyCheckins || {}).map(([q, v]: any) => ({
    quarter: q,
    rate: v.completionRate || 0
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" />
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'blue' },
          { label: 'Goals Approved', value: stats.approved, icon: CheckCircle, color: 'green' },
          { label: 'Submission Rate', value: stats.submissionRate + '%', icon: Send, color: 'amber' },
          { label: 'Approval Rate', value: stats.approvalRate + '%', icon: ShieldCheck, color: 'purple' },
        ].map((item, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 text-sm">{item.label}</span>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${item.color}-100`}>
                <item.icon className="w-5 h-5" style={{ color: `var(--${item.color}-600)` }} />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800">{item.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-semibold text-lg mb-6">Goal Status Distribution</h3>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold">{stats.totalGoals}</span>
              <span className="text-xs text-slate-500">Total Goals</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center text-sm">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: d.fill }} />
                <span className="text-slate-600 mr-1">{d.name}</span>
                <span className="font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-3">
          <h3 className="font-semibold text-lg mb-6">Quarterly Check-in Completion</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => v + '%'} />
                <YAxis type="category" dataKey="quarter" />
                <RechartsTooltip formatter={(val: any) => val + '%'} />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.rate < 50 ? '#EF4444' : entry.rate < 80 ? '#F59E0B' : '#22C55E'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}