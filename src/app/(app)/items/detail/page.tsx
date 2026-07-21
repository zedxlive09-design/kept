'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, Tag, Store, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { supabase, type Item, type Reminder } from '@/lib/supabase/client';
import { syncRemindersForItem } from '@/lib/reminders';
import { StatusStamp } from '@/components/items/StatusStamp';
import { ItemForm } from '@/components/items/ItemForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

import { formatDate, formatAmount } from '@/lib/format';

export default function ItemDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [item, setItem] = useState<Item | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*, reminders(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      const row = data as unknown as Item & { reminders: Reminder[] };
      setItem(row);
      setReminders(row.reminders ?? []);

      // Fetch signed URL for private bucket receipt image
      if (row.receipt_image_path) {
        const { data: signedData } = await supabase.storage
          .from('receipts')
          .createSignedUrl(row.receipt_image_path, 3600);
        if (signedData) setReceiptUrl(signedData.signedUrl);
      } else {
        setReceiptUrl(null);
      }
    } catch {
      toast.error('Could not load item');
      router.push('/items');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleDelete = async () => {
    if (!item) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('items').delete().eq('id', item.id);
      if (error) throw error;
      toast.success('Item deleted');
      router.push('/items');
    } catch {
      toast.error('Could not delete item');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center text-muted-foreground">
        Item not found.
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => { setEditing(false); fetchItem(); }} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
        <ItemForm
          mode="edit"
          defaultValues={{
            id: item.id,
            type: item.type,
            name: item.name,
            merchant: item.merchant ?? '',
            amount: item.amount,
            currency: item.currency,
            category: item.category,
            notes: item.notes ?? '',
            purchase_date: item.purchase_date,
            warranty_months: item.warranty_months,
            billing_cycle: item.billing_cycle,
            next_billing_date: item.next_billing_date,
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/items">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Items
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold truncate">{item.name}</h1>
          {item.merchant && (
            <p className="text-sm text-muted-foreground">{item.merchant}</p>
          )}
        </div>
        <StatusStamp status={item.status} />
      </div>

      {/* Details card */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Tag className="h-4 w-4" />
            <span className="text-sm">Category</span>
          </div>
          <Badge variant="secondary">{item.category}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Store className="h-4 w-4" />
            <span className="text-sm">Type</span>
          </div>
          <span className="text-sm capitalize">{item.type}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="font-mono tabular-nums text-sm font-medium">
            {formatAmount(item.amount, item.currency)}
          </span>
        </div>

        {item.type === 'purchase' && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Purchase date</span>
              </div>
              <span className="font-mono tabular-nums text-sm">{formatDate(item.purchase_date)}</span>
            </div>
            {item.warranty_months && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Warranty</span>
                <span className="text-sm">{item.warranty_months} months — expires {formatDate(item.warranty_expiry)}</span>
              </div>
            )}
          </>
        )}

        {item.type !== 'purchase' && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Billing cycle</span>
              </div>
              <span className="text-sm capitalize">{item.billing_cycle}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Next billing</span>
              </div>
              <span className="font-mono tabular-nums text-sm">{formatDate(item.next_billing_date)}</span>
            </div>
          </>
        )}

        {item.notes && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Notes</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}
      </div>

      {/* Receipt image */}
      {item.receipt_image_path && receiptUrl && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setImageOpen(true)}
            className="block w-full rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity"
          >
            <img
              src={receiptUrl}
              alt="Receipt"
              className="w-full h-auto max-h-64 object-contain bg-muted"
            />
          </button>
          <Dialog open={imageOpen} onOpenChange={setImageOpen}>
            <DialogContent className="max-w-3xl p-2">
              <DialogTitle className="sr-only">Receipt image</DialogTitle>
              <img
                src={receiptUrl}
                alt="Receipt"
                className="w-full h-auto rounded-md"
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Reminder history */}
      {reminders.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <h2 className="text-sm font-medium mb-3">Reminder history</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">
                  {r.kind.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono tabular-nums">{formatDate(r.remind_on)}</span>
                  {r.sent && (
                    <Badge variant="secondary" className="text-xs">Sent</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4 mr-1.5" />
          Edit
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="flex-1 text-destructive hover:text-destructive" disabled={deleting}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this item?</AlertDialogTitle>
              <AlertDialogDescription>
                This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}