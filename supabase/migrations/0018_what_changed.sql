-- Who changed what, and when.
--
-- Written by a trigger rather than by the application, and that is the whole
-- point: every path reaches the same table. The back of the house, a script, the
-- SQL editor, a future page nobody has written yet — none of them can forget to
-- log, because none of them is doing the logging.
--
-- One row per field that actually changed, because "somebody edited the story" is
-- not an answer to "what happened to the place it says it was". Values are kept as
-- text and truncated: this is a record of what changed, not a second copy of the
-- content.

create table if not exists public.changes (
  id bigserial primary key,
  at timestamptz not null default now(),
  by_profile uuid references public.profiles(id) on delete set null,
  what text not null,
  row_id uuid not null,
  did text not null,
  field text,
  was text,
  now text
);

create index if not exists changes_lately on public.changes (at desc);
create index if not exists changes_by_row on public.changes (what, row_id, at desc);

alter table public.changes enable row level security;

drop policy if exists "admins read the changes" on public.changes;
create policy "admins read the changes"
  on public.changes for select using (public.is_admin());

-- No write policy at all, deliberately. The trigger is security definer and
-- writes on everybody's behalf; a log anybody can add to is not a log.

create or replace function public.note_the_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid;
  before jsonb;
  after jsonb;
  key text;
  old_value text;
  new_value text;
begin
  select id into me from public.profiles where user_id = auth.uid();

  if tg_op = 'INSERT' then
    insert into public.changes (by_profile, what, row_id, did)
    values (me, tg_table_name, new.id, 'made');
    return new;
  end if;

  if tg_op = 'DELETE' then
    insert into public.changes (by_profile, what, row_id, did)
    values (me, tg_table_name, old.id, 'deleted for good');
    return old;
  end if;

  before := to_jsonb(old);
  after := to_jsonb(new);

  -- Binning and restoring are their own acts, not an edit to a timestamp.
  if (before ->> 'deleted_at') is null and (after ->> 'deleted_at') is not null then
    insert into public.changes (by_profile, what, row_id, did)
    values (me, tg_table_name, new.id, 'put in the bin');
    return new;
  end if;
  if (before ->> 'deleted_at') is not null and (after ->> 'deleted_at') is null then
    insert into public.changes (by_profile, what, row_id, did)
    values (me, tg_table_name, new.id, 'taken out of the bin');
    return new;
  end if;

  for key in select jsonb_object_keys(after) loop
    -- Nothing anybody decided: stamps, and the id itself.
    continue when key in ('updated_at', 'created_at', 'id', 'updated_by');

    old_value := before ->> key;
    new_value := after ->> key;
    continue when old_value is not distinct from new_value;

    insert into public.changes (by_profile, what, row_id, did, field, was, now)
    values (
      me, tg_table_name, new.id, 'edited', key,
      left(coalesce(old_value, ''), 300),
      left(coalesce(new_value, ''), 300)
    );
  end loop;

  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'stories', 'photos', 'quotes', 'news', 'events', 'donations',
    'associations', 'pages', 'profiles', 'story_blocks', 'theme'
  ] loop
    execute format('drop trigger if exists note_changes on public.%I', t);
    execute format(
      'create trigger note_changes after insert or update or delete on public.%I
         for each row execute function public.note_the_change()', t);
  end loop;
end $$;
