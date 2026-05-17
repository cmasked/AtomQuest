import { useState, useEffect } from 'react';
import { getCycles, createCycle, activateCycle } from '@/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function CycleManagementPage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phase: 'GOAL_SETTING', year: 2025, opensAt: '', closesAt: '' });

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
      const data = await getCycles();
      setCycles(data.cycles || []);
    } catch {
      toast.error('Failed to load cycles');
    }
  };

  const handleActivate = async (id: string) => {
    if (!window.confirm("This will deactivate the current cycle. Continue?")) return;
    try {
      await activateCycle(id);
      toast.success('Cycle activated');
      fetchCycles();
    } catch {
      toast.error('Failed to activate cycle');
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (new Date(form.closesAt) <= new Date(form.opensAt)) {
      toast.error('Closes At must be after Opens At');
      return;
    }
    try {
      await createCycle({
        ...form,
        opensAt: new Date(form.opensAt).toISOString(),
        closesAt: new Date(form.closesAt).toISOString()
      });
      toast.success('Cycle created');
      setSheetOpen(false);
      fetchCycles();
    } catch {
      toast.error('Failed to create cycle');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Goal Cycles" actions={<Button className="bg-brand-orange text-white" onClick={() => { setForm({ name: '', phase: 'GOAL_SETTING', year: 2025, opensAt: '', closesAt: '' }); setSheetOpen(true); }}>+ New Cycle</Button>} />
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-left">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">Name</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">Phase</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">Year</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">Opens</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">Closes</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cycles.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{c.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {c.phase.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.year}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{format(new Date(c.opensAt), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{format(new Date(c.closesAt), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4">
                    {c.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="outline" size="sm" 
                      disabled={c.isActive} 
                      onClick={() => handleActivate(c.id)}
                      className={c.isActive 
                        ? "border-transparent bg-transparent text-slate-300 dark:text-slate-600" 
                        : "border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white transition-colors"}>
                      Activate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>New Cycle</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 block">Name</label>
              <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. 2025 Annual Goals" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 block">Phase</label>
              <Select value={form.phase} onValueChange={v => setForm({...form, phase: v})}>
                <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <SelectItem value="GOAL_SETTING">Goal Setting</SelectItem>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 block">Year</label>
              <Input type="number" required value={form.year} onChange={e => setForm({...form, year: Number(e.target.value)})} min={2024} max={2030} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 block">Opens At</label>
                <Input type="date" required value={form.opensAt} onChange={e => setForm({...form, opensAt: e.target.value})} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 block">Closes At</label>
                <Input type="date" required value={form.closesAt} onChange={e => setForm({...form, closesAt: e.target.value})} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit" className="w-full bg-brand-orange hover:bg-orange-600 text-white shadow-sm shadow-orange-200 dark:shadow-none font-semibold">Save Cycle</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}