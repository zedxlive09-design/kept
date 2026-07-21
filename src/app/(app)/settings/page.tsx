'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, type Profile, type Item } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TIMEZONES = Intl.supportedValuesOf
  ? Intl.supportedValuesOf('timeZone')
  : ['UTC'];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [emailReminders, setEmailReminders] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      const p = data as unknown as Profile;
      setProfile(p);
      setDisplayName(p.display_name ?? '');
      setTimezone(p.timezone);
      setEmailReminders(p.email_reminders_enabled);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName || null,
          timezone,
          email_reminders_enabled: emailReminders,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Saved');
    } catch {
      toast.error('Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10000);

      if (error) throw error;

      const items = (data ?? []) as unknown as Item[];
      if (items.length === 0) {
        toast.error('No items to export');
        return;
      }

      const headers = [
        'name', 'type', 'status', 'merchant', 'category', 'amount', 'currency',
        'purchase_date', 'warranty_months', 'warranty_expiry',
        'billing_cycle', 'next_billing_date', 'notes', 'created_at',
      ];

      const rows = items.map((item) =>
        headers.map((h) => {
          const val = item[h as keyof Item];
          if (val == null) return '';
          const str = String(val);
          // Escape CSV fields
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      );

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kept-items.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported');
    } catch {
      toast.error('Could not export items');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
        <Skeleton className="h-7 w-24" />
        {/* Display name field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        {/* Timezone field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        {/* Email reminders toggle row */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
        {/* Save button */}
        <Skeleton className="h-10 w-full rounded-md" />
        {/* Divider */}
        <Skeleton className="h-px w-full" />
        {/* Export section */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-72" />
          <Skeleton className="h-10 w-44 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Display name */}
        <div className="space-y-2">
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-y-auto">
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Email reminders toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Email reminders</Label>
            <p className="text-sm text-muted-foreground">Get notified before warranties expire and bills are due</p>
          </div>
          <Switch
            checked={emailReminders}
            onCheckedChange={setEmailReminders}
          />
        </div>

        {/* Save */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save'}
        </Button>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Export */}
        <div className="space-y-2">
          <Label>Export data</Label>
          <p className="text-sm text-muted-foreground">Download all your items as a CSV file.</p>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export items as CSV
          </Button>
        </div>
      </div>
    </div>
  );
}