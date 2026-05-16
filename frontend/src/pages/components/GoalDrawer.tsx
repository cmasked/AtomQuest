import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Goal } from '@/components/ui/GoalCard';
import { createGoal, updateGoal } from '@/api/goals';
import { useCycleStore } from '@/store/cycleStore';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';

const THRUST_AREAS = [
  "Sales & Revenue",
  "Operations",
  "Customer Success",
  "People & Culture",
  "Finance",
  "Technology",
  "Safety",
  "Strategy"
];

const goalSchema = z.object({
  thrustArea: z.string().min(1, "Thrust area is required"),
  title: z.string().min(1, "Title is required").max(100, "Max 100 characters"),
  description: z.string().max(500, "Max 500 characters").optional(),
  uomType: z.enum(['NUMERIC_MIN', 'NUMERIC_MAX', 'TIMELINE', 'ZERO']),
  targetValue: z.number().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  weightage: z.number().min(10, "Min weightage is 10").max(100, "Max weightage is 100"),
}).superRefine((data, ctx) => {
  if ((data.uomType === 'NUMERIC_MIN' || data.uomType === 'NUMERIC_MAX') && (data.targetValue === null || data.targetValue === undefined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Target value is required for numeric UoM",
      path: ["targetValue"]
    });
  }
  if (data.uomType === 'TIMELINE' && !data.targetDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Target date is required for timeline UoM",
      path: ["targetDate"]
    });
  }
});

type GoalFormValues = z.infer<typeof goalSchema>;

interface GoalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal | null;
  onSuccess: () => void;
  availableWeightage: number;
}

export function GoalDrawer({ isOpen, onClose, goal, onSuccess, availableWeightage }: GoalDrawerProps) {
  const { activeCycle } = useCycleStore();
  const isEditing = !!goal;

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      thrustArea: '',
      title: '',
      description: '',
      uomType: 'NUMERIC_MIN',
      targetValue: null,
      targetDate: '',
      weightage: 10,
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const uomType = form.watch('uomType');
  const title = form.watch('title');
  const description = form.watch('description');

  useEffect(() => {
    if (isOpen) {
      if (goal) {
        form.reset({
          thrustArea: goal.thrustArea,
          title: goal.title,
          description: goal.description || '',
          uomType: goal.uomType as any,
          targetValue: goal.targetValue,
          targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
          weightage: goal.weightage,
        });
      } else {
        form.reset({
          thrustArea: '',
          title: '',
          description: '',
          uomType: 'NUMERIC_MIN',
          targetValue: null,
          targetDate: '',
          weightage: 10,
        });
      }
    }
  }, [isOpen, goal, form]);

  const onSubmit = async (data: GoalFormValues) => {
    try {
      // Validate available weightage
      const currentWeightage = goal?.weightage || 0;
      const proposedAddition = data.weightage - currentWeightage;
      
      if (proposedAddition > availableWeightage) {
        form.setError('weightage', { 
          type: 'manual', 
          message: `Cannot exceed available weightage (${availableWeightage + currentWeightage}%)` 
        });
        return;
      }

      const payload = {
        ...data,
        cycleId: activeCycle?.id,
        targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : undefined,
      };

      if (isEditing) {
        await updateGoal(goal.id, payload);
        toast.success("Goal updated successfully");
      } else {
        await createGoal(payload);
        toast.success("Goal created successfully");
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save goal");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEditing ? "Edit Goal" : "Add Goal"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Modify your draft goal." : "Create a new goal for the current cycle."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Thrust Area <span className="text-red-500">*</span></Label>
            <Select 
              value={form.watch('thrustArea')} 
              onValueChange={(val) => form.setValue('thrustArea', val, { shouldValidate: true })}
            >
              <SelectTrigger className={form.formState.errors.thrustArea ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a thrust area" />
              </SelectTrigger>
              <SelectContent>
                {THRUST_AREAS.map(area => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.thrustArea && <p className="text-sm text-red-500">{form.formState.errors.thrustArea.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Goal Title <span className="text-red-500">*</span></Label>
            <Input 
              placeholder="e.g. Increase regional sales revenue by Q4" 
              {...form.register('title')}
              className={form.formState.errors.title ? "border-red-500" : ""}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>{form.formState.errors.title?.message || ""}</span>
              <span>{title?.length || 0}/100</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              placeholder="Describe what success looks like..." 
              className={form.formState.errors.description ? "border-red-500 min-h-[100px]" : "min-h-[100px]"}
              {...form.register('description')}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>{form.formState.errors.description?.message || ""}</span>
              <span>{description?.length || 0}/500</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Unit of Measurement <span className="text-red-500">*</span></Label>
            <RadioGroup 
              value={uomType} 
              onValueChange={(val: any) => {
                form.setValue('uomType', val);
                form.setValue('targetValue', null);
                form.setValue('targetDate', '');
              }}
              className="grid gap-3"
            >
              <div className="flex items-start space-x-3 space-y-0 p-3 border rounded-md cursor-pointer hover:bg-slate-50" onClick={() => form.setValue('uomType', 'NUMERIC_MIN')}>
                <RadioGroupItem value="NUMERIC_MIN" id="r1" className="mt-1" />
                <Label htmlFor="r1" className="font-normal cursor-pointer flex-1">
                  <div className="font-medium text-slate-900">Numeric — Higher Better</div>
                  <div className="text-xs text-slate-500 mt-1">e.g. Sales Revenue, Units Sold</div>
                </Label>
              </div>
              <div className="flex items-start space-x-3 space-y-0 p-3 border rounded-md cursor-pointer hover:bg-slate-50" onClick={() => form.setValue('uomType', 'NUMERIC_MAX')}>
                <RadioGroupItem value="NUMERIC_MAX" id="r2" className="mt-1" />
                <Label htmlFor="r2" className="font-normal cursor-pointer flex-1">
                  <div className="font-medium text-slate-900">Numeric — Lower Better</div>
                  <div className="text-xs text-slate-500 mt-1">e.g. TAT, Cost, Defects</div>
                </Label>
              </div>
              <div className="flex items-start space-x-3 space-y-0 p-3 border rounded-md cursor-pointer hover:bg-slate-50" onClick={() => form.setValue('uomType', 'TIMELINE')}>
                <RadioGroupItem value="TIMELINE" id="r3" className="mt-1" />
                <Label htmlFor="r3" className="font-normal cursor-pointer flex-1">
                  <div className="font-medium text-slate-900">Timeline</div>
                  <div className="text-xs text-slate-500 mt-1">e.g. Project completion by a date</div>
                </Label>
              </div>
              <div className="flex items-start space-x-3 space-y-0 p-3 border rounded-md cursor-pointer hover:bg-slate-50" onClick={() => form.setValue('uomType', 'ZERO')}>
                <RadioGroupItem value="ZERO" id="r4" className="mt-1" />
                <Label htmlFor="r4" className="font-normal cursor-pointer flex-1">
                  <div className="font-medium text-slate-900">Zero Based</div>
                  <div className="text-xs text-slate-500 mt-1">e.g. Safety incidents, Complaints</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {(uomType === 'NUMERIC_MIN' || uomType === 'NUMERIC_MAX') && (
            <div className="space-y-2">
              <Label>Target Value <span className="text-red-500">*</span></Label>
              <Input 
                type="number" 
                placeholder="e.g. 5000000" 
                {...form.register('targetValue', { valueAsNumber: true })}
                className={form.formState.errors.targetValue ? "border-red-500" : ""}
              />
              {form.formState.errors.targetValue && <p className="text-sm text-red-500">{form.formState.errors.targetValue.message}</p>}
            </div>
          )}

          {uomType === 'TIMELINE' && (
            <div className="space-y-2">
              <Label>Target Date <span className="text-red-500">*</span></Label>
              <Input 
                type="date" 
                {...form.register('targetDate')}
                className={form.formState.errors.targetDate ? "border-red-500" : ""}
              />
              {form.formState.errors.targetDate && <p className="text-sm text-red-500">{form.formState.errors.targetDate.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Weightage (%) <span className="text-red-500">*</span></Label>
              <span className="text-xs text-brand-orange font-medium">Available: {availableWeightage + (goal?.weightage || 0)}%</span>
            </div>
            <div className="flex items-center gap-4">
              <Input 
                type="number" 
                min="10" 
                max="100" 
                {...form.register('weightage', { valueAsNumber: true })}
                className={form.formState.errors.weightage ? "border-red-500" : ""}
              />
              <input 
                type="range" 
                min="10" 
                max="100" 
                step="1"
                className="flex-1 accent-brand-orange"
                value={form.watch('weightage') || 10}
                onChange={(e) => form.setValue('weightage', parseInt(e.target.value), { shouldValidate: true })}
              />
            </div>
            {form.formState.errors.weightage && <p className="text-sm text-red-500">{form.formState.errors.weightage.message}</p>}
          </div>

          <SheetFooter className="pt-4 border-t mt-8">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-brand-orange hover:bg-brand-orange/90 text-white min-w-[120px]" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save Goal"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
