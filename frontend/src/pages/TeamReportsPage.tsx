import { useState, useEffect } from 'react';
import { getAchievementReport, exportAchievementReport, exportAchievementReportCSV } from '@/api/reports';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';

export default function TeamReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState('All');
  const [globalFilter, setGlobalFilter] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [quarter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAchievementReport({ quarter: quarter === 'All' ? undefined : quarter as any });
      setData(res.report || []);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: 'xlsx' | 'csv') => {
    setDownloading(format);
    try {
      const blob = format === 'xlsx'
        ? await exportAchievementReport({ quarter: quarter === 'All' ? undefined : quarter as any })
        : await exportAchievementReportCSV({ quarter: quarter === 'All' ? undefined : quarter as any });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `achievement_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setDownloading(null);
    }
  };

  const columns = [
    { accessorKey: 'employeeName', header: 'Employee' },
    { 
      accessorKey: 'goalTitle', 
      header: 'Goal Title',
      cell: ({ getValue }: any) => {
        const val = getValue() || '';
        if (val.length <= 40) return val;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="text-left">{val.substring(0, 40)}...</TooltipTrigger>
              <TooltipContent><p className="max-w-xs">{val}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    { 
      accessorKey: 'thrustArea', 
      header: 'Thrust Area',
      cell: ({ getValue }: any) => <Badge variant="secondary">{getValue()}</Badge>
    },
    { 
      accessorKey: 'uomType', 
      header: 'UoM',
      cell: ({ getValue }: any) => {
        const type = getValue();
        if (type === 'NUMERIC_MIN') return '↑ Numeric';
        if (type === 'NUMERIC_MAX') return '↓ Numeric';
        if (type === 'TIMELINE') return '📅 Timeline';
        return '◯ Zero';
      }
    },
    { 
      accessorKey: 'target', 
      header: () => <div className="text-right">Target</div>,
      cell: ({ row }: any) => {
        const val = row.original.targetValue || row.original.targetDate;
        if (!val) return <div className="text-right">—</div>;
        const display = row.original.uomType === 'TIMELINE' ? format(new Date(val), 'dd MMM yyyy') : val;
        return <div className="text-right">{display}</div>;
      }
    },
    { 
      accessorKey: 'actualValue', 
      header: () => <div className="text-right">Actual</div>,
      cell: ({ getValue }: any) => <div className="text-right">{getValue() ?? '—'}</div>
    },
    { 
      accessorKey: 'computedScore', 
      header: 'Score %',
      cell: ({ getValue }: any) => {
        const score = getValue();
        if (score === null || score === undefined) return <span className="text-slate-400">—</span>;
        let color = 'text-blue-600';
        if (score < 50) color = 'text-red-600';
        else if (score < 80) color = 'text-amber-600';
        else if (score <= 100) color = 'text-green-600';
        return <span className={`font-bold ${color}`}>{score}%</span>;
      }
    },
    { 
      accessorKey: 'progressStatus', 
      header: 'Status',
      cell: ({ getValue }: any) => <StatusBadge status={getValue() || 'NOT_STARTED'} />
    }
  ];

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Team Achievement Report" />
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex gap-4">
          <Select value={quarter} onValueChange={setQuarter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Quarter" />
            </SelectTrigger>
            <SelectContent>
              {['All', 'Q1', 'Q2', 'Q3', 'Q4'].map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input 
            placeholder="Search employee or goal..." 
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="w-full sm:w-[300px]"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleDownload('csv')} disabled={downloading !== null} variant="outline" className="border-brand-orange text-brand-orange">
            {downloading === 'csv' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            CSV
          </Button>
          <Button onClick={() => handleDownload('xlsx')} disabled={downloading !== null} className="bg-brand-orange text-white">
            {downloading === 'xlsx' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-md" />)}
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={BarChart} title="No achievement data yet" />
      ) : (
        <div className="rounded-md border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id} onClick={h.column.getToggleSortingHandler()} className="px-4 py-3 text-left font-medium text-slate-600 cursor-pointer">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}