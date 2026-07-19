-- ============================================================
-- Kept — Storage Bucket + RLS (§6)
-- ============================================================
-- Apply in Supabase Dashboard → SQL Editor after the initial schema migration.
--
-- Bucket: receipts (private)
-- Path pattern: {user_id}/{item_id}/{timestamp}-{filename}
-- Item UUID generated client-side via crypto.randomUUID() before upload
-- so storage path and DB row share the same ID.

insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false);

create policy "receipts_select_own"
on storage.objects for select
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "receipts_insert_own"
on storage.objects for insert
with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "receipts_delete_own"
on storage.objects for delete
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);