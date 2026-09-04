import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

/**
 * Reading a post before anybody else does.
 *
 * Both app stores want a feed to be moderated. Neither of them wants to hear
 * that a club of sixty people has nobody free on a Tuesday night to read it, and
 * that is the honest position: there is no moderator, there is not going to be
 * one, and a rule nobody enforces is worse than no rule because it is a promise
 * broken quietly.
 *
 * So the reading is done by a model, once, at the moment somebody presses post,
 * and it has exactly three answers:
 *
 *   fine     — it goes up. Which is nearly everything.
 *   no       — it does not go up, and the person is told why in one sentence.
 *   flag     — it goes up, and it is put in front of the club's own admins.
 *
 * The middle answer is the one worth arguing about. Refusing to publish is a
 * serious thing to do to somebody who has just written something, so it is kept
 * for the cases nobody would defend: sexual content, an attack on a person,
 * something plainly illegal. Everything with an argument on both sides — a
 * photograph that might be somebody who has not been asked, a joke that reads
 * badly in the second language — goes up *and* gets flagged, because a club is
 * better at judging its own conversations than a model is, and because the cost
 * of being wrong in that direction is somebody waiting an hour rather than
 * somebody being silenced.
 *
 * And when the screening cannot run at all — no key, the API down, a timeout —
 * the post goes up. A feed that stops working because a third party is having a
 * bad morning is a worse failure than an unscreened post in a club where
 * everybody knows each other's name.
 */

const Verdict = z.object({
  /* Three answers and no scores. A number between 0 and 1 would only move the
     decision somewhere else and make it look objective on the way. */
  verdict: z.enum(["fine", "no", "flag"]),
  /* Which rule, for the club's admins to read in a list. */
  because: z.enum([
    "sexual",
    "attacking somebody",
    "illegal",
    "not theirs",
    "nothing to do with the club",
    "something else",
  ]),
  /* One sentence, addressed to whoever wrote it. Shown only for "no". */
  said: z.string(),
});

export type Verdict = z.infer<typeof Verdict>;

const RULES = `You are reading a post before it appears on the members' feed of
promeNOODology, a small club in Geneva that cooks, walks, builds things and puts
on public evenings. Sixty-odd people, all of whom have met each other. The feed
is for what somebody found, what is left over after Saturday, who is driving past
Nyon on Tuesday.

Answer with one of three verdicts.

"no" — refuse to publish. Only for things nobody in the club would defend:
  - sexual or pornographic content, in the words or in a photograph
  - an attack on a person: abuse, threats, slurs, somebody being humiliated
  - something plainly illegal, or an attempt to sell or arrange something illegal
  - somebody's private information posted without them: an address, a phone
    number, a document

"flag" — publish it, but show it to the club's own admins. For anything you are
not sure about, and specifically:
  - a photograph where somebody may not have agreed to be in it
  - anything that reads as an advertisement or a scam
  - work that is plainly somebody else's, posted as theirs
  - a subject with nothing to do with this club at all
  - anything you would hesitate over

"fine" — everything else, and this is nearly everything. Swearing is fine. An
argument is fine. A photograph of people eating and drinking is exactly what this
feed is for; wine on a table is not a drug reference. Bad jokes are fine. French
and English are both used here, and a post that mixes them is normal.

The rule for choosing between "no" and "flag": if you can imagine a reasonable
member of this club defending the post, it is "flag" at worst. "no" is for what
nobody would defend.

"said" is one plain sentence addressed to the person who wrote it, in the
language they wrote in, saying what the problem is. No apology, no lecture, no
mention of policies or of being an AI. It is only shown when the verdict is "no".`;

/** How long to wait before deciding the club is better off without an answer. */
const PATIENCE = 12_000;

export async function readItFirst(
  words: string,
  pictures: string[] = [],
): Promise<Verdict> {
  const fine: Verdict = { verdict: "fine", because: "something else", said: "" };

  if (!words.trim() && pictures.length === 0) return fine;

  /* No key: the words are still read, by a list rather than a model.
   *
   * The model is the good version of this and the club turns it on with one
   * environment variable. Until then — and Apple's Guideline 1.2 asks for "a method
   * for filtering objectionable content" in the present tense — the plainest
   * version stands in: a short list of the words that have no place on a feed
   * about dinner, and a refusal at the point of posting when one of them is in
   * it. Pictures cannot be read this way and are let through to be reported. It
   * is a fence, not a reader, and it says so in the list's own name. */
  if (!process.env.ANTHROPIC_API_KEY) return fence(words);

  const client = new Anthropic();

  /* The pictures go by URL rather than by bytes: the bucket is public — that is
     how the app draws them — so this is a link the model fetches itself instead
     of a megabyte of base64 through our own server. Four at most; a post with
     twelve photographs of the same table does not need twelve readings. */
  const looks = pictures.slice(0, 4).map((url) => ({
    type: "image" as const,
    source: { type: "url" as const, url },
  }));

  try {
    const answer = await client.messages.parse(
      {
        model: "claude-opus-5",
        max_tokens: 1000,
        system: RULES,
        /* Low, because this is a small judgement made sixty times a week and not
           a hard problem. It still thinks; it does not deliberate. */
        output_config: { effort: "low", format: zodOutputFormat(Verdict) },
        messages: [
          {
            role: "user",
            content: [
              ...looks,
              {
                type: "text",
                text: words.trim()
                  ? `The words of the post:\n\n${words.trim()}`
                  : "The post has no words, only the picture or pictures above.",
              },
            ],
          },
        ],
      },
      { timeout: PATIENCE },
    );

    return answer.parsed_output ?? fine;
  } catch {
    /* Down, slow, rate-limited, or refusing to answer. The post goes up. See the
       note at the top of this file: a feed that stops because somebody else's
       service is having a bad morning is the worse failure. */
    return fine;
  }
}

/* The fence: what a list can catch when there is nothing to read with.
 *
 * Kept short and kept to the unambiguous — slurs and the plainest sexual and
 * violent terms, in the two languages this club writes in. Anything that needs
 * context to be objectionable is left to reports and to the model, because a list
 * that reaches for context is a list that stops people saying "breast of lamb".
 * Matched on whole words, case-insensitively, so "assistant" is not "ass". */
const FENCE = [
  // slurs and dehumanising terms
  "nigger", "nigga", "faggot", "tranny", "retard", "retarded", "kike", "spic", "chink",
  "nègre", "négro", "pédé", "tarlouze", "bougnoule", "youpin",
  // the plainest sexual terms
  "porn", "porno", "cum", "cumshot", "blowjob", "handjob", "dick pic", "tits",
  "pornographie", "branlette", "fellation", "bite",
  // violence aimed at a person
  "kill yourself", "kys", "rape", "raping", "rapist",
  "suicide-toi", "viol", "violeur",
];

const FENCE_TEST = new RegExp(
  `(^|[^\\p{L}\\p{N}])(${FENCE.map((one) => one.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=$|[^\\p{L}\\p{N}])`,
  "iu",
);

function fence(words: string): Verdict {
  const hit = FENCE_TEST.exec(words);
  if (!hit) return { verdict: "fine", because: "something else", said: "" };
  const word = hit[2].toLowerCase();
  const sexual = /porn|cum|blow|hand|dick|tits|branl|fella|bite/.test(word);
  const violent = /kill|kys|rape|rapi|suicide|viol/.test(word);
  return {
    verdict: "no",
    because: sexual ? "sexual" : violent ? "attacking somebody" : "attacking somebody",
    said: "That has a word in it that has no place here. Say it another way.",
  };
}
