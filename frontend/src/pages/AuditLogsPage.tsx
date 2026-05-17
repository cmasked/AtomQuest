import { useState } from 'react';
import { getAuditLog } from '@/api/reports';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileSearch, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<any[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search) return;
    try {
      const data = await getAuditLog(search);
      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" subtitle="Track all changes to goals after approval" />
      
      <form onSubmit={handleSearch} className="flex gap-3 w-full max-w-xl">
        <Input placeholder="Enter Goal ID to view audit trail..." value={search} onChange={e => setSearch(e.target.value)} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 h-11" />
        <Button type="submit" className="bg-brand-navy hover:bg-slate-800 text-white h-11 px-6 shadow-sm"><Search className="w-4 h-4 mr-2"/>Search</Button>
      </form>

      {logs === null ? (
        <EmptyState icon={FileSearch} title="Enter a Goal ID to view its history" description="Goal IDs can be found on the reports." />
      ) : logs.length === 0 ? (
        <EmptyState icon={Search} title="No audit entries found" />
      ) : (
        <div className="mt-8 ml-4 relative border-l-2 border-slate-200 dark:border-slate-800 space-y-8 py-4">
          {logs.map((entry, i) => (
            <div key={i} className="relative pl-8">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-brand-orange border-4 border-white dark:border-slate-950 shadow-sm shadow-orange-200" />
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {formatDistanceToNow(new Date(entry.changedAt), { addSuffix: true })}
                </span>
                <span className="text-xs text-slate-500">
                  by <span className="font-semibold text-slate-700 dark:text-slate-300">{entry.changedByUser?.name}</span>
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 font-mono text-[11px] md:text-xs">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-3 uppercase tracking-wider text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Before
                  </div>
                  <div className="space-y-1.5 text-red-800 dark:text-red-300">
                    {Object.entries(entry.oldValue || {}).map(([k, v]) => (
                      <div key={k} className="flex">
                        <span className="w-4 shrink-0 opacity-50">-</span>
                        <span className="font-semibold opacity-70 w-24 shrink-0">{k}:</span>
                        <span>{JSON.stringify(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-xl p-4 font-mono text-[11px] md:text-xs">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold mb-3 uppercase tracking-wider text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> After
                  </div>
                  <div className="space-y-1.5 text-green-800 dark:text-green-300">
                    {Object.entries(entry.newValue || {}).map(([k, v]) => (
                      <div key={k} className="flex">
                        <span className="w-4 shrink-0 opacity-50">+</span>
                        <span className="font-semibold opacity-70 w-24 shrink-0">{k}:</span>
                        <span>{JSON.stringify(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}