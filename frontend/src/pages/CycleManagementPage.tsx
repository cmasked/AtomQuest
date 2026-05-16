import { useState, useEffect } from 'react';
import { getCycles, createCycle, activateCycle } from '@/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 font-medium">
            <tr><th className="p-4">Name</th><th className="p-4">Phase</th><th className="p-4">Year</th><th className="p-4">Opens</th><th className="p-4">Closes</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cycles.map(c => (
              <tr key={c.id}>
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4"><Badge variant="outline">{c.phase}</Badge></td>
                <td className="p-4">{c.year}</td>
                <td className="p-4">{format(new Date(c.opensAt), 'dd MMM yyyy')}</td>
                <td className="p-4">{format(new Date(c.closesAt), 'dd MMM yyyy')}</td>
                <td className="p-4">{c.isActive ? <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</td>
                <td className="p-4">
                  <Button variant="ghost" size="sm" disabled={c.isActive} onClick={() => handleActivate(c.id)}>Activate</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>New Cycle</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div><Label>Name</Label><Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. 2025 Annual Goals" /></div>
            <div><Label>Phase</Label>
              <Select value={form.phase} onValueChange={v => setForm({...form, phase: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="GOAL_SETTING">Goal Setting</SelectItem><SelectItem value="Q1">Q1</SelectItem><SelectItem value="Q2">Q2</SelectItem><SelectItem value="Q3">Q3</SelectItem><SelectItem value="Q4">Q4</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Year</Label><Input type="number" required value={form.year} onChange={e => setForm({...form, year: Number(e.target.value)})} min={2024} max={2030} /></div>
            <div><Label>Opens At</Label><Input type="date" required value={form.opensAt} onChange={e => setForm({...form, opensAt: e.target.value})} /></div>
            <div><Label>Closes At</Label><Input type="date" required value={form.closesAt} onChange={e => setForm({...form, closesAt: e.target.value})} /></div>
            <Button type="submit" className="w-full bg-brand-orange text-white">Save Cycle</Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}