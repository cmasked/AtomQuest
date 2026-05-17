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

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Dashboard" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />)}
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
      </div>
    );
  }

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: stats.totalEmployees, icon: Users, colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-100 dark:bg-blue-900/40' },
          { label: 'Goals Approved', value: stats.approved, icon: CheckCircle, colorClass: 'text-green-600 dark:text-green-400', bgClass: 'bg-green-100 dark:bg-green-900/40' },
          { label: 'Submission Rate', value: stats.submissionRate + '%', icon: Send, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-100 dark:bg-amber-900/40' },
          { label: 'Approval Rate', value: stats.approvalRate + '%', icon: ShieldCheck, colorClass: 'text-brand-orange', bgClass: 'bg-brand-orange/10' },
        ].map((item, i) => (
          <Card key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                {item.label}
              </span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.bgClass}`}>
                <item.icon className={`w-4.5 h-4.5 ${item.colorClass}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {item.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="p-6 lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Goal Status Distribution</h3>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalGoals}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Goals</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center text-sm">
                <span className="w-2.5 h-2.5 rounded-full mr-2 shadow-sm" style={{ backgroundColor: d.fill }} />
                <span className="text-slate-500 dark:text-slate-400 mr-1.5">{d.name}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Quarterly Check-in Completion</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="quarter" tick={{ fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
                <RechartsTooltip 
                  formatter={(val: any) => [val + '%', 'Completion']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="rate" radius={[4, 4, 4, 4]} barSize={24}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.rate < 50 ? '#EF4444' : entry.rate < 80 ? '#F59E0B' : '#FF6B00'} />
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