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
      
      <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-xl">
        <Input placeholder="Enter Goal ID to view audit trail..." value={search} onChange={e => setSearch(e.target.value)} />
        <Button type="submit" className="bg-brand-navy"><Search className="w-4 h-4 mr-2"/>Search</Button>
      </form>

      {logs === null ? (
        <EmptyState icon={FileSearch} title="Enter a Goal ID to view its history" description="Goal IDs can be found on the reports." />
      ) : logs.length === 0 ? (
        <EmptyState icon={Search} title="No audit entries found" />
      ) : (
        <div className="mt-8 ml-4">
          {logs.map((entry, i) => (
            <div key={i} className="relative pl-8 pb-6 border-l-2 border-slate-200">
              <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-brand-orange -translate-x-1.5" />
              <div className="text-xs text-slate-500 mb-2">
                {formatDistanceToNow(new Date(entry.changedAt), { addSuffix: true })} · by {entry.changedByUser?.name}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 rounded-md p-3 font-mono text-xs">
                  <div className="text-red-600 font-medium mb-1">Before</div>
                  {Object.entries(entry.oldValue || {}).map(([k, v]) => <div key={k} className="text-red-700">- {k}: {JSON.stringify(v)}</div>)}
                </div>
                <div className="bg-green-50 rounded-md p-3 font-mono text-xs">
                  <div className="text-green-600 font-medium mb-1">After</div>
                  {Object.entries(entry.newValue || {}).map(([k, v]) => <div key={k} className="text-green-700">+ {k}: {JSON.stringify(v)}</div>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}