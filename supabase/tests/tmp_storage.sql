-- Run only against a local/test database after applying the tmp migration:
-- supabase db query --local --file supabase/tests/tmp_storage.sql
-- Every fixture and the deliberately broad policy are rolled back.
begin;

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'tmp' and public = false) then
    raise exception 'tmp must be a private bucket';
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('tmp-rls-test-other', 'tmp-rls-test-other', false);

insert into storage.objects (bucket_id, name)
values
  ('tmp', '11111111-1111-4111-8111-111111111111/rls-test-own.txt'),
  ('tmp', '22222222-2222-4222-8222-222222222222/rls-test-other.txt'),
  ('tmp-rls-test-other', 'rls-test.txt');

-- Prove the restrictive guard still works in the presence of broad grants.
create policy "tmp_rls_test_broad_grant" on storage.objects
for all to public using (true) with check (true);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

do $$
declare affected integer;
begin
  if (select count(*) from storage.objects where bucket_id = 'tmp') <> 1 then
    raise exception 'authenticated users must see only their directory';
  end if;

  insert into storage.objects (bucket_id, name)
  values ('tmp', '11111111-1111-4111-8111-111111111111/nested/rls-test-new.txt');

  begin
    insert into storage.objects (bucket_id, name)
    values ('tmp', '22222222-2222-4222-8222-222222222222/rls-test-forbidden.txt');
    raise exception 'cross-user upload was allowed';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into storage.objects (bucket_id, name) values ('tmp', 'rls-test-root.txt');
    raise exception 'root upload was allowed';
  exception when insufficient_privilege then null;
  end;

  update storage.objects set metadata = '{"size":12}'
  where bucket_id = 'tmp' and name = '11111111-1111-4111-8111-111111111111/rls-test-own.txt';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'own update must succeed'; end if;

  begin
    update storage.objects
    set name = '22222222-2222-4222-8222-222222222222/rls-test-moved.txt'
    where bucket_id = 'tmp' and name = '11111111-1111-4111-8111-111111111111/rls-test-own.txt';
    raise exception 'moving a file into another user directory was allowed';
  exception when insufficient_privilege then null;
  end;

  update storage.objects set metadata = '{"size":999}'
  where bucket_id = 'tmp' and name = '22222222-2222-4222-8222-222222222222/rls-test-other.txt';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'cross-user update was allowed'; end if;

  -- Storage API sets this flag itself. Here we are testing the same DELETE RLS.
  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects
  where bucket_id = 'tmp' and name = '22222222-2222-4222-8222-222222222222/rls-test-other.txt';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'cross-user delete was allowed'; end if;

  delete from storage.objects
  where bucket_id = 'tmp' and name = '11111111-1111-4111-8111-111111111111/nested/rls-test-new.txt';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'own delete must succeed'; end if;
end $$;

set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
do $$
begin
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'tmp' and name = '22222222-2222-4222-8222-222222222222/rls-test-other.txt'
  ) then raise exception 'second user must see their own file'; end if;
  if exists (
    select 1 from storage.objects
    where bucket_id = 'tmp' and name = '11111111-1111-4111-8111-111111111111/rls-test-own.txt'
  ) then raise exception 'second user can see first user files'; end if;
end $$;

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$
begin
  if exists (select 1 from storage.objects where bucket_id = 'tmp') then
    raise exception 'anonymous users can access tmp';
  end if;
  begin
    insert into storage.objects (bucket_id, name)
    values ('tmp', '11111111-1111-4111-8111-111111111111/rls-test-anon.txt');
    raise exception 'anonymous upload was allowed';
  exception when insufficient_privilege then null;
  end;
  if not exists (select 1 from storage.objects where bucket_id = 'tmp-rls-test-other') then
    raise exception 'tmp guard changed access to other buckets';
  end if;
end $$;

reset role;
rollback;
