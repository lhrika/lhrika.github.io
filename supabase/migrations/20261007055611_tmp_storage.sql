-- Private temporary storage. Objects live under tmp/<auth.uid()>/.
insert into storage.buckets (id, name, public, file_size_limit)
values ('tmp', 'tmp', false, 52428800)
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit;

create policy "tmp_select_own_directory"
on storage.objects for select to authenticated
using (
  bucket_id = 'tmp'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "tmp_insert_own_directory"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'tmp'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "tmp_update_own_directory"
on storage.objects for update to authenticated
using (
  bucket_id = 'tmp'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'tmp'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "tmp_delete_own_directory"
on storage.objects for delete to authenticated
using (
  bucket_id = 'tmp'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Permissive policies are OR'ed together. This guard prevents existing broad
-- policies from granting another user's directory, including to anon callers.
-- Other buckets continue to use their existing policies.
create policy "tmp_require_own_directory"
on storage.objects as restrictive for all to public
using (
  bucket_id <> 'tmp'
  or (
    (select auth.uid()) is not null
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
)
with check (
  bucket_id <> 'tmp'
  or (
    (select auth.uid()) is not null
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
);
