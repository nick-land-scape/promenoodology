# The emails

Three emails. Two of them are the whole of signing in — there are no passwords on
this site, so a code in an inbox is the only key there is — and the third is for
somebody moving their account to a different address.

They live in the Supabase dashboard rather than in this repository — Supabase
renders them, not us — so these files are the copy of record. Change them here,
paste them there, so the next person can find out what the emails say without a
dashboard login.

## Putting them in

There is a script, and it exists because pasting is where this goes wrong: each
template has its own save button, and an email that looks unchanged is
indistinguishable from one that was never saved.

```bash
SUPABASE_ACCESS_TOKEN=sbp_... node scripts/email-templates.mjs --check
SUPABASE_ACCESS_TOKEN=sbp_... node scripts/email-templates.mjs
```

`--check` says what is actually up there — the subject, whether the template
carries a code at all, whether it matches the file here, and what the OTP length
is set to. Without `--check` it writes both. The token comes from
[account/tokens](https://supabase.com/dashboard/account/tokens); it is read from
the environment and never written down.

By hand instead: **Authentication → Emails**, one at a time, paste the file's
contents into the message body and set the subject line next to it.

| File | Template | Subject |
|---|---|---|
| `magic-link.html` | Magic Link | `Your code for promeNOODology` |
| `confirm-signup.html` | Confirm signup | `Welcome to promeNOODology — here is your code` |
| `email-change.html` | Change Email Address | `Confirm your new address for promeNOODology` |

They are not interchangeable: **Magic Link** goes to somebody who already has an
account, **Confirm signup** to somebody joining for the first time, and **Change
Email Address** to the new inbox when somebody changes their address on
`/account`. Supabase picks between them, so leaving any of them on the stock
template means some of the people knocking get a bare blue link that may not even
work where they open it.

**Change Email Address** carries no code, and should not: a code is typed into the
page you left open, which checks it against the address in a cookie — the address
being left behind. There is nowhere for that code to go, so that email sends the
link and says as much.

## Why `{{ .Token }}` matters

The stock templates contain only `{{ .ConfirmationURL }}` — a link and nothing
else. That is why the first emails from this project arrived with no code in
them: the code page had nothing to show because the email never carried one.

`{{ .Token }}` is the code. Both files put it first and the link second, because
the code works in the browser you are already in, and a link opens whichever
browser the mail app prefers.

How many characters that code has is a project setting:
**Authentication → Providers → Email → Email OTP Length**. This project is set to
**eight**, not the six Supabase ships with. It has to agree with `CODE_LENGTH` in
`lib/auth-code.ts`, which decides how many boxes the code page draws — a row of
six boxes cut the last two characters off an eight-character code, sent the stump,
and was told the code had expired. Which it had not. `--check` above prints the
setting, so there is no need to guess.

## Why the link is not `{{ .ConfirmationURL }}`

Both templates link through `{{ .RedirectTo }}?token_hash={{ .TokenHash }}`
rather than through Supabase's own `{{ .ConfirmationURL }}`, and land on
`/account/confirm`.

The stock URL hands back a `pkce_…` token, and trading that for a session needs a
secret left in a cookie by the browser that asked for the code. Open the link on
your phone, or in a webmail tab, or in any browser other than the one you started
in, and there is no secret to trade with — the link cannot work, and it fails
looking like an expired link rather than like a mismatch.

The token hash needs nothing kept anywhere. It is checked against the address it
was issued for, so the link opens wherever the inbox happens to be, which is the
whole point of sending a link at all.

`{{ .RedirectTo }}` rather than `{{ .SiteURL }}`, so the link follows whichever
copy of the site sent it: an email triggered from a laptop lands back on that
laptop, one from production lands on production.

## Sending them at all

Supabase's built-in sender works, but it is limited to a couple of emails an hour
— fine for trying it, not for four people signing in at once. Real sending needs
SMTP, under **Project Settings → Authentication → SMTP Settings**.

The domain's mail is at Infomaniak and its SPF record already says so, so their
SMTP is the short way there and no new sender domain has to be warmed up:

| | |
|---|---|
| Host | `mail.infomaniak.com` |
| Port | `465` (SSL) or `587` (STARTTLS) |
| Username | the full address, e.g. `info@promenoodology.com` |
| Sender name | `promeNOODology` |

Check that DKIM is switched on for the domain in the Infomaniak manager while you
are there. SPF alone gets an email delivered; DKIM is what keeps it out of the
spam folder.

## While you are in there

**Authentication → URL Configuration** needs every address the site answers at,
or the link in the email bounces:

```
http://localhost:3000/**
https://promenoodology.vercel.app/**
https://promenoodology.com/**
https://app.promenoodology.com/**
```
