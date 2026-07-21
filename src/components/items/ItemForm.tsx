'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { supabase, type Item, type ItemType } from '@/lib/supabase/client';
import { syncRemindersForItem } from '@/lib/reminders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { label: 'Electronics', value: 'electronics' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Home & Garden', value: 'home & garden' },
  { label: 'Health & Beauty', value: 'health & beauty' },
  { label: 'Food & Dining', value: 'food & dining' },
  { label: 'Other', value: 'other' },
] as const;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

const formSchema = z.object({
  type: z.enum(['purchase', 'subscription', 'bill']),
  name: z.string().min(1, 'Name is required'),
  merchant: z.string().optional().default(''),
  amount: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().default('USD'),
  category: z.string().min(1, 'Category is required'),
  notes: z.string().optional().default(''),
  // Purchase-specific
  purchase_date: z.string().optional().nullable(),
  warranty_months: z.coerce.number().min(1).optional().nullable(),
  // Subscription/Bill-specific
  billing_cycle: z.string().optional().nullable(),
  next_billing_date: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface ItemFormProps {
  defaultValues?: Partial<FormValues & { id: string }>;
  mode?: 'create' | 'edit';
  /** Storage path for the receipt image — set by AI pipeline */
  receiptImagePath?: string;
  /** Raw AI extraction result — stored in ai_extracted column */
  aiExtracted?: Record<string, unknown>;
}

function computeWarrantyExpiry(purchaseDate: string | null | undefined, warrantyMonths: number | null | undefined): string | null {
  if (!purchaseDate || !warrantyMonths) return null;
  const d = new Date(purchaseDate + 'T00:00:00');
  d.setMonth(d.getMonth() + warrantyMonths);
  return d.toISOString().split('T')[0];
}

export function ItemForm({ defaultValues, mode = 'create', receiptImagePath, aiExtracted }: ItemFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState(defaultValues?.category ?? 'other');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'purchase',
      name: '',
      merchant: '',
      amount: null,
      currency: 'USD',
      category: 'other',
      notes: '',
      purchase_date: null,
      warranty_months: null,
      billing_cycle: null,
      next_billing_date: null,
      ...defaultValues,
    },
  });

  const watchType = form.watch('type');

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const warranty_expiry = computeWarrantyExpiry(values.purchase_date, values.warranty_months);

      const row = {
        user_id: user.id,
        type: values.type as ItemType,
        name: values.name,
        merchant: values.merchant || null,
        category: values.category,
        amount: values.amount ?? null,
        currency: values.currency,
        purchase_date: values.type === 'purchase' ? (values.purchase_date || null) : null,
        warranty_months: values.type === 'purchase' ? (values.warranty_months ?? null) : null,
        warranty_expiry: values.type === 'purchase' ? warranty_expiry : null,
        billing_cycle: values.type !== 'purchase' ? (values.billing_cycle || null) : null,
        next_billing_date: values.type !== 'purchase' ? (values.next_billing_date || null) : null,
        notes: values.notes || null,
        is_ai_extracted: !!aiExtracted,
        receipt_image_path: receiptImagePath || null,
        ai_extracted: aiExtracted || null,
      };

      let itemId = defaultValues?.id;

      if (mode === 'edit' && itemId) {
        const { error } = await supabase.from('items').update(row).eq('id', itemId);
        if (error) throw error;

        // Re-sync reminders after edit to reflect any date/cycle changes
        const { data: updated } = await supabase
          .from('items')
          .select('*')
          .eq('id', itemId)
          .single();
        if (updated) {
          await syncRemindersForItem(supabase, updated as unknown as Item);
        }
      } else {
        const { data, error } = await supabase.from('items').insert(row).select('*, reminders(*)').single();
        if (error) throw error;
        const item = data as unknown as Item & { reminders: unknown[] };
        itemId = item.id;
        await syncRemindersForItem(supabase, item);
      }

      toast.success('Saved');
      if (mode === 'edit' && itemId) {
        router.push(`/items/detail?id=${itemId}`);
      } else {
        router.push('/items');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save item';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const typeOptions: { value: ItemType; label: string }[] = [
    { value: 'purchase', label: 'Purchase' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'bill', label: 'Bill' },
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {/* Type toggle */}
      <div className="space-y-2">
        <Label>Type</Label>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                watchType === opt.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => form.setValue('type', opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Common fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="What did you buy?"
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="merchant">Merchant</Label>
          <Input
            id="merchant"
            placeholder="Store or service name"
            {...form.register('merchant')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...form.register('amount')}
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={form.watch('currency')}
              onValueChange={(v) => form.setValue('currency', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category combobox */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={categoryOpen}
                className="w-full justify-between"
              >
                {CATEGORIES.find((c) => c.value === categoryValue)?.label ?? categoryValue || 'Select category...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search or type..." />
                <CommandList>
                  <CommandEmpty>No category found.</CommandEmpty>
                  <CommandGroup>
                    {CATEGORIES.map((cat) => (
                      <CommandItem
                        key={cat.value}
                        value={cat.value}
                        onSelect={() => {
                          setCategoryValue(cat.value);
                          form.setValue('category', cat.value);
                          setCategoryOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            categoryValue === cat.value ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {cat.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Optional notes..."
            {...form.register('notes')}
          />
        </div>
      </div>

      {/* Purchase-specific fields */}
      {watchType === 'purchase' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="purchase_date">Purchase date</Label>
            <Input
              id="purchase_date"
              type="date"
              {...form.register('purchase_date')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warranty_months">Warranty months</Label>
            <Input
              id="warranty_months"
              type="number"
              min="1"
              placeholder="e.g. 12"
              {...form.register('warranty_months')}
            />
          </div>
        </div>
      )}

      {/* Subscription/Bill-specific fields */}
      {watchType !== 'purchase' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Billing cycle</Label>
            <Select
              value={form.watch('billing_cycle') || ''}
              onValueChange={(v) => form.setValue('billing_cycle', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="next_billing_date">Next billing date</Label>
            <Input
              id="next_billing_date"
              type="date"
              {...form.register('next_billing_date')}
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <Button type="submit" disabled={saving} className="w-full">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}