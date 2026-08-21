-- A number that belongs to a person for good.
--
-- The number on the People screen was a row's place in an alphabetical list: it
-- moved the moment anybody was added or renamed, which makes it useless as a way
-- to refer to somebody. This one is given once and never changes.
--
-- The order the existing sixty-five were numbered in: the day they became one of
-- us, then the day their row was written, then their name. Every one of them says
-- the same joining date — it is the day of the import — so in practice the four
-- whose rows predate the import took 1 to 4 and the rest fell out alphabetically.
-- Correcting a joining date later does not renumber anybody: a number that moves
-- is not a number.

alter table public.profiles add column if not exists member_no integer;

create unique index if not exists profiles_member_no on public.profiles (member_no);

with ordered as (
  select id, row_number() over (order by joined_on, created_at, name, id) as n
    from public.profiles
   where member_no is null
)
update public.profiles p
   set member_no = ordered.n
  from ordered
 where p.id = ordered.id;

-- And everybody after them: the next one up, worked out when the row is written.
-- Not a sequence, because a sequence spends numbers on rows that were never
-- created and leaves gaps nobody can explain.
create or replace function public.give_member_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.member_no is null then
    select coalesce(max(member_no), 0) + 1 into new.member_no from public.profiles;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_member_no on public.profiles;
create trigger profiles_member_no
  before insert on public.profiles
  for each row execute function public.give_member_no();
