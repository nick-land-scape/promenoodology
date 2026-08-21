-- The trigger functions are not something anybody should be able to call.
--
-- Every function in the public schema is offered as an RPC endpoint, so
-- /rest/v1/rpc/note_the_change exists whether we meant it to or not. In practice
-- calling one gets you "trigger functions can only be called as triggers" — but
-- an endpoint that exists and refuses is still an endpoint, and it was eight
-- warnings from the database's own linter standing between us and the next real
-- one.
--
-- Only these four. is_admin() and me() are read inside the row level security
-- policies themselves, which run as whoever is asking, so revoking those would
-- shut the whole database; newsletter_signup and confirm_newsletter are public on
-- purpose — they are how the form and the link in the email work.
--
-- Checked afterwards: the triggers still fire (an edit in the back of the house
-- landed in the change log, and the guard from 0020 still refused to move a
-- member number), and the endpoint is gone from the schema cache.
revoke execute on function public.note_the_change() from anon, authenticated;
revoke execute on function public.give_member_no() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.you_edit_yourself_not_your_rank() from anon, authenticated;
