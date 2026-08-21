import "server-only";
import nodemailer from "nodemailer";
import { SITE_URL } from "./site";

/**
 * The one email this site sends itself.
 *
 * Everything to do with signing in goes through Supabase, which has its own SMTP
 * settings and its own templates. This is for the newsletter, which is not an
 * account and has nothing to do with signing in: somebody puts their address on
 * a list, and the only proof that the address is theirs is that they answer a
 * note sent to it.
 *
 * Through the same Infomaniak mailbox the sign-in emails go through, because the
 * domain's mail already lives there and its SPF record already says so — nothing
 * to warm up, no second sender for a spam filter to be suspicious of.
 *
 * With no SMTP settings it does not pretend: `canSend` is false and the form says
 * so rather than claiming an email is on its way.
 */

const host = process.env.SMTP_HOST ?? "";
const port = Number(process.env.SMTP_PORT ?? 465);
const user = process.env.SMTP_USER ?? "";
const pass = process.env.SMTP_PASS ?? "";
const from = process.env.SMTP_FROM || user;

export const canSend = Boolean(host && user && pass);

let transport: nodemailer.Transporter | null = null;

function post() {
  transport ??= nodemailer.createTransport({
    host,
    port,
    // 465 is TLS from the first byte; 587 starts plain and upgrades.
    secure: port === 465,
    auth: { user, pass },
  });
  return transport;
}

export type Letter = {
  to: string;
  subject: string;
  html: string;
  /** For the mail clients that will not render HTML, and for the spam score. */
  text: string;
};

export async function send(letter: Letter): Promise<{ ok: boolean; error?: string }> {
  if (!canSend) {
    return { ok: false, error: "There are no SMTP settings, so nothing can be sent." };
  }

  try {
    await post().sendMail({
      from: `promeNOODology <${from}>`,
      to: letter.to,
      subject: letter.subject,
      html: letter.html,
      text: letter.text,
    });
    return { ok: true };
  } catch (error) {
    // Said plainly in the log; the form above says something kinder.
    console.error("Sending failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Sending failed." };
  }
}

/**
 * The note that asks somebody to confirm they meant it.
 *
 * Same materials as the site and as the sign-in emails: paper rather than white,
 * Times for what is read, Helvetica in small capitals for what is a label. Times
 * and Helvetica are on every machine that will open this, so it arrives looking
 * like the site rather than looking like a loading state.
 */
export function confirmationLetter(email: string, token: string): Letter {
  const link = `${SITE_URL}/newsletter/confirm?token=${token}`;

  return {
    to: email,
    subject: "One click and you are on the list",
    text: [
      "Somebody — we hope you — put this address on the promeNOODology newsletter.",
      "",
      "Open this to confirm it:",
      link,
      "",
      "If it was not you, do nothing. Without that click the address stays off the",
      "list, and we will not write again.",
      "",
      "info@promeNOODology.com",
    ].join("\n"),
    html: `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffcf6;margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:36px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:440px;">

        <tr>
          <td style="padding-bottom:26px;">
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1.6px;text-transform:uppercase;color:#8b3fff;">promeNOODology</span>
          </td>
        </tr>

        <tr>
          <td style="font-family:Times,'Times New Roman',Georgia,serif;font-size:30px;line-height:1.1;color:#000000;padding-bottom:10px;">
            one click and you are on the list
          </td>
        </tr>

        <tr>
          <td style="font-family:Times,'Times New Roman',Georgia,serif;font-size:17px;line-height:1.45;color:#000000;padding-bottom:26px;">
            Somebody — we hope you — put this address on our list. We only write
            when there is something to come to, and never otherwise.
          </td>
        </tr>

        <tr>
          <td>
            <a href="${link}" style="display:inline-block;border:1px solid #000000;padding:13px 22px;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#000000;text-decoration:none;">
              yes, that was me
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding-top:28px;border-top:1px solid rgba(0,0,0,0.12);margin-top:28px;">
            <p style="font-family:Times,'Times New Roman',Georgia,serif;font-size:14px;line-height:1.45;color:#6f6a63;font-style:italic;margin:22px 0 0;">
              If it was not you, do nothing at all. Without that click the address
              stays off the list, and this is the only note it will ever get.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding-top:22px;">
            <a href="mailto:info@promeNOODology.com" style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:#e82687;text-decoration:none;">info@promeNOODology.com</a>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>`.trim(),
  };
}
