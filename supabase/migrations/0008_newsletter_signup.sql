-- Signing up for the newsletter, when nobody may read the list.
--
-- The insert policy lets anybody add themselves and the select policy lets only
-- an admin look — which is right, and which means the thing doing the signing up
-- cannot read back the token it needs to put in the confirmation email. It cannot
-- even find out whether the address is already there.
--
-- So one function does the whole step and hands back only what the email needs:
-- the token, and whether this person had already confirmed. It cannot list
-- anybody, cannot look anybody up by name, and answers about exactly the one
-- address it was given.

create or replace function public.newsletter_signup(the_email text, the_name text)
returns table (token uuid, already boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  found public.newsletter;
begin
  select * into found
    from public.newsletter
    where lower(email) = lower(trim(the_email));

  if found.id is null then
    insert into public.newsletter (email, name)
      values (lower(trim(the_email)), coalesce(trim(the_name), ''))
      returning * into found;
    return query select found.token, false;
    return;
  end if;

  -- Already on the list. If they never confirmed, the same token goes out
  -- again — a second attempt should get a working link, not silence. If they
  -- did confirm, the caller is told so and sends nothing.
  --
  -- A name is filled in if we did not have one, and never overwritten: the one
  -- they gave first is the one they chose.
  if found.name = '' and coalesce(trim(the_name), '') <> '' then
    update public.newsletter set name = trim(the_name) where id = found.id;
  end if;

  return query select found.token, found.confirmed;
end;
$$;

revoke all on function public.newsletter_signup(text, text) from public;
grant execute on function public.newsletter_signup(text, text) to anon, authenticated;
