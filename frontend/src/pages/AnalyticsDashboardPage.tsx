import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/analytics/summary').then(res => setData(res.data)).catch(console.error);
  }, []);

  if (!data) return <div className="p-8 animate-pulse space-y-6"><div className="h-24 bg-slate-200 rounded-xl" /><div className="h-64 bg-slate-200 rounded-xl" /></div>;

  const { trends, heatmap, distribution, effectiveness } = data;

  return (
    <div className="space-y-6">
      <PageHeader title="Advanced Analytics & Trends (Bonus)" />

      {/* QoQ Trends */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">QoQ Goal Achievement Trends</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="quarter" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <RechartsTooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="avgScore" name="Avg Score" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="completed" name="Completed Goals" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Distribution by Thrust Area */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-6">Goal Distribution by Thrust Area</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution.byThrustArea} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <RechartsTooltip />
                <Bar dataKey="count" name="Total Goals" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Manager Effectiveness */}
        <Card className="p-6 overflow-auto">
          <h3 className="font-semibold text-lg mb-6">Manager Effectiveness</h3>
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Manager</th>
                <th className="px-4 py-3">Team Size</th>
                <th className="px-4 py-3">Avg Team Score</th>
                <th className="px-4 py-3 rounded-tr-lg">Check-in Rate</th>
              </tr>
            </thead>
            <tbody>
              {effectiveness.map((mgr: any) => (
                <tr key={mgr.managerId} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{mgr.managerName}</td>
                  <td className="px-4 py-3">{mgr.teamSize}</td>
                  <td className="px-4 py-3">{mgr.avgTeamScore ?? 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${mgr.checkinCompletionRate >= 80 ? 'bg-green-100 text-green-700' : mgr.checkinCompletionRate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {mgr.checkinCompletionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Completion Heatmap */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Department Completion Heatmap</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="category" dataKey="quarter" name="Quarter" allowDuplicatedCategory={false} />
              <YAxis type="category" dataKey="department" name="Department" allowDuplicatedCategory={false} />
              <ZAxis type="number" dataKey="completionRate" range={[50, 400]} name="Completion Rate" />
              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(val: any, name: string) => name === 'Completion Rate' ? val + '%' : val} />
              <Scatter name="Completion" data={heatmap} fill="#22C55E">
                {heatmap.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.completionRate < 50 ? '#EF4444' : entry.completionRate < 80 ? '#F59E0B' : '#22C55E'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
