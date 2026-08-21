-- What a member may change about themselves, and what they may not.
--
-- The policy on profiles says "you edit yourself":
--
--   for update using (id = public.me() or public.is_admin())
--   with check (id = public.me() or public.is_admin())
--
-- which is right about the row and says nothing at all about the columns. Row
-- level security cannot: a policy sees a whole row, so a member who may edit
-- their own row may edit every column of it — including `role`. The same public
-- key the site ships to every browser could set it to 'admin', and then is_admin()
-- is true and the whole back of the house is open.
--
-- This was found while giving members a portrait and an address they can change
-- themselves, which is the moment it stopped being theoretical: those are the
-- first writes a member's own session makes to their own row.
--
-- A trigger, because that is the only place the question "did this column move?"
-- can be asked at all — a policy has no `old`. It raises rather than quietly
-- putting the value back: somebody typing a name into their profile never touches
-- these columns, so anything that reaches this is either a mistake worth hearing
-- about or somebody trying it on.

create or replace function public.you_edit_yourself_not_your_rank()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- An admin is the one who is allowed to move all of this, and does, from the
  -- people screen.
  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Only an admin can change what somebody is.';
  end if;

  if new.listed_by_admin is distinct from old.listed_by_admin then
    raise exception 'Only an admin can overrule whether somebody is shown.';
  end if;

  if new.member_no is distinct from old.member_no then
    raise exception 'A member number does not move.';
  end if;

  if new.joined_on is distinct from old.joined_on then
    raise exception 'Only an admin can change the day somebody joined.';
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'A profile cannot be pointed at a different login.';
  end if;

  /* The address on the profile may only be set to the address you are actually
     signed in with. That is what keeps it able to follow a confirmed email
     change — which is done by the member's own session, in
     app/(site)/account/confirm — without letting anybody write whatever they
     like into it. */
  if new.email is distinct from old.email
     and lower(coalesce(new.email, '')) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'Your profile can only hold the address you sign in with.';
  end if;

  return new;
end;
$$;

drop trigger if exists your_own_row on public.profiles;
create trigger your_own_row
  before update on public.profiles
  for each row execute function public.you_edit_yourself_not_your_rank();
