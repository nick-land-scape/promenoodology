# The emails

Two emails, and they are the whole of signing in: there are no passwords on this
site, so a code in an inbox is the only key there is.

They live in the Supabase dashboard rather than in this repository — Supabase
renders them, not us — so these files are the copy of record. Change them here,
paste them there, so the next person can find out what the emails say without a
dashboard login.

## Where they go

**Authentication → Emails**, one at a time. Paste the file's contents into the
message body and set the subject line next to it.

| File | Template | Subject |
|---|---|---|
| `magic-link.html` | Magic Link | `Your code for promeNOODology` |
| `confirm-signup.html` | Confirm signup | `Welcome to promeNOODology — here is your code` |

Both are needed, and they are not interchangeable: **Magic Link** goes to
somebody who already has an account, **Confirm signup** to somebody joining for
the first time. Supabase picks between them, so leaving one on the stock template
means half the people who sign in get a bare blue link and no code.

## Why `{{ .Token }}` matters

The stock templates contain only `{{ .ConfirmationURL }}` — a link and nothing
else. That is why the first emails from this project arrived with no code in
them: the code page had nothing to show because the email never carried one.

`{{ .Token }}` is the code. Both files put it first and the link second, because
the code works in the browser you are already in, and a link opens whichever
browser the mail app prefers.

How many characters that code has is a project setting:
**Authentication → Providers → Email → Email OTP Length** (six by default). It has
to agree with `CODE_LENGTH` in `lib/auth-code.ts`, which decides how many boxes
the code page draws. Change one, change the other.

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
