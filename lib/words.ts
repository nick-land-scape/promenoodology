/**
 * The words the site says on its own behalf.
 *
 * Everything else that is translated is content — what somebody wrote in the
 * back of the house, with its French kept beside it in the same row. These are
 * the other half: "still wanted", "and what has been", "take it as a PDF". They
 * are in the code because they are part of the design rather than part of what
 * anybody had to say, and that is exactly why they were the half left in
 * English.
 *
 * Plain data, no JSX, so a server page, a client component and the editor in the
 * back of the house all read the same list.
 *
 * Three rules for adding one:
 *
 * A key is forever. It is what the French is filed under, so renaming one
 * silently drops the translation — change the English freely, never the key.
 *
 * `where` is where somebody would go looking for it, not which file it is in.
 * Somebody hunting for the wrong word on an evening's page thinks "the front of
 * the house", and would never guess it was in a component shared with the app.
 *
 * The French written here is a starting point, not the answer. It is what the
 * site says until somebody in the back of the house says otherwise, and the
 * whole point of the page there is that the person who knows both languages is
 * not the person who wrote the component.
 */

/** Which half of the house a phrase belongs to. */
export type Where = "front" | "app" | "back";

export type Phrase = {
  key: string;
  en: string;
  /** What the site says in French until somebody changes it. */
  fr: string;
  where: Where;
  /** Where it appears, for whoever is translating it out of context. */
  note?: string;
};

export const PHRASES: Phrase[] = [
  /* ------------------------------------------------------- what's on, the list */
  { key: "on.today", en: "today", fr: "aujourd’hui", where: "front", note: "A heading over the evenings that are on today." },
  { key: "on.thisWeek", en: "this week", fr: "cette semaine", where: "front", note: "A heading over the next seven days." },
  { key: "on.later", en: "later on", fr: "plus tard", where: "front", note: "A heading over everything after that." },
  { key: "on.been", en: "and what has been", fr: "et ce qui a eu lieu", where: "front", note: "A heading over the evenings that have happened." },
  { key: "on.nothing", en: "Nothing is on just now. There will be.", fr: "Rien pour le moment. Cela viendra.", where: "front" },
  { key: "on.asMonth", en: "see it as a month", fr: "voir le mois", where: "front", note: "Opens the calendar." },
  { key: "on.backToList", en: "back to the list", fr: "revenir à la liste", where: "front", note: "Closes the calendar." },
  { key: "on.nextOn", en: "next on", fr: "prochainement le", where: "front", note: "Followed by a date: “next on 22 August”." },
  { key: "on.days", en: "days, from", fr: "jours, à partir du", where: "front", note: "As in “5 days, from 22 August”." },

  /* ------------------------------------------------------------- the calendar */
  { key: "cal.pressOne", en: "The marked days have something on. Press one.", fr: "Les jours marqués ont quelque chose. Appuyez sur l’un d’eux.", where: "front" },
  { key: "cal.nothingThatDay", en: "Nothing on that day.", fr: "Rien ce jour-là.", where: "front" },
  { key: "cal.monthBefore", en: "The month before", fr: "Le mois précédent", where: "front", note: "Read out by a screen reader; not shown." },
  { key: "cal.monthAfter", en: "The month after", fr: "Le mois suivant", where: "front", note: "Read out by a screen reader; not shown." },

  /* --------------------------------------------------------- an evening's page */
  { key: "event.allEvents", en: "all events", fr: "tous les événements", where: "front", note: "The way back, top left." },
  { key: "event.theStories", en: "the stories", fr: "les récits", where: "front" },
  { key: "event.theArchive", en: "the archive", fr: "l’archive", where: "front" },
  { key: "event.programme", en: "the programme", fr: "le programme", where: "front", note: "Over the list of days." },
  { key: "event.coming", en: "coming", fr: "venir", where: "front", note: "Over when, where and what it costs." },
  { key: "event.when", en: "when", fr: "quand", where: "front" },
  { key: "event.where", en: "where", fr: "où", where: "front" },
  { key: "event.cost", en: "what it costs", fr: "tarif", where: "front" },
  { key: "event.howToCome", en: "asking to come", fr: "pour participer", where: "front" },
  { key: "event.howManyAte", en: "how many ate", fr: "nombre de repas servis", where: "front" },
  { key: "event.stillWanted", en: "still wanted", fr: "encore nécessaire", where: "front", note: "Over the list of things people could bring." },
  { key: "event.partOf", en: "part of", fr: "dans le cadre de", where: "front" },
  { key: "event.with", en: "with", fr: "avec", where: "front", note: "Over the partners' logos." },
  { key: "event.whatCameOfIt", en: "what came of it", fr: "ce qui en est sorti", where: "front", note: "Links to the story written afterwards." },
  { key: "event.itHasBeen", en: "it has been", fr: "c’est passé", where: "front", note: "Added to the date of an evening that is over." },
  { key: "event.stillArranged", en: "still being arranged", fr: "en cours d’organisation", where: "front" },
  { key: "event.theFlyer", en: "the flyer", fr: "le flyer", where: "front" },
  { key: "event.takeAsPdf", en: "take it as a PDF ↓", fr: "télécharger le PDF ↓", where: "front" },
  { key: "event.lookThrough", en: "look through the flyer", fr: "feuilleter le flyer", where: "front", note: "Opens the flyer as a book." },
  { key: "event.inTheApp", en: "In the members’ app —", fr: "Dans l’app des membres —", where: "front" },
  { key: "event.places", en: "places", fr: "places", where: "front", note: "As in “, 20 places”." },

  /* ------------------------------------------------ taking part, on the website */
  { key: "part.countMeIn", en: "count me in", fr: "je viens", where: "front" },
  { key: "part.save", en: "save this evening", fr: "garder cette soirée", where: "front" },
  {
    key: "part.why",
    en: "Asking to come and keeping an evening on your list are for members —",
    fr: "S’inscrire et garder une soirée de côté sont réservés aux membres —",
    where: "front",
  },
  { key: "part.join", en: "join the community", fr: "rejoindre la communauté", where: "front" },
  { key: "part.bothWork", en: "and both of these work, here and in the app.", fr: "et les deux fonctionnent, ici comme dans l’app.", where: "front" },
  { key: "part.orWrite", en: "Or write to", fr: "Ou écrivez à", where: "front" },
  { key: "part.takingNames", en: "who are taking the names for this one.", fr: "qui gèrent les inscriptions pour celui-ci.", where: "front" },

  /* --------------------------------------------------------------- the handbook */
  { key: "book.theCover", en: "the cover", fr: "la couverture", where: "front" },
  { key: "book.of", en: "of", fr: "sur", where: "front", note: "As in “3 of 24”." },
  { key: "book.soundOn", en: "sound on", fr: "son activé", where: "front" },
  { key: "book.soundOff", en: "sound off", fr: "son coupé", where: "front" },
  { key: "book.pageBefore", en: "The page before", fr: "La page précédente", where: "front" },
  { key: "book.nextPage", en: "The next page", fr: "La page suivante", where: "front" },

  /* ------------------------------------------------------------- a story's page */
  { key: "story.eveningItCameFrom", en: "the evening it came from", fr: "la soirée dont il est issu", where: "front" },
  { key: "story.eveningsItCameFrom", en: "the evenings it came from", fr: "les soirées dont il est issu", where: "front" },

  /* ------------------------------------------------------ the app's own account */
  { key: "app.readingIn", en: "the language you read us in", fr: "la langue dans laquelle vous nous lisez", where: "app" },
  {
    key: "app.readingInNote",
    en: "It follows your account, so it is the same here and on the website. Anything nobody has translated yet is shown in English.",
    fr: "Elle suit votre compte : la même ici et sur le site. Ce qui n’est pas encore traduit s’affiche en anglais.",
    where: "app",
  },

  /* --------------------------------------------------------- the back of the house */
  { key: "back.english", en: "English", fr: "English", where: "back", note: "The name of the language, in itself — it is not translated." },
  { key: "back.french", en: "Français", fr: "Français", where: "back", note: "The same." },
];

const BY_KEY = new Map(PHRASES.map((phrase) => [phrase.key, phrase]));

/** Everything that belongs in one half of the house, in the order written. */
export function phrasesIn(where: Where): Phrase[] {
  return PHRASES.filter((phrase) => phrase.where === where);
}

export const WHERES: { key: Where; name: string; blurb: string }[] = [
  {
    key: "front",
    name: "the website",
    blurb:
      "What the pages say on their own behalf: the headings over the evenings, the words on the buttons, the labels beside the practical bits.",
  },
  {
    key: "app",
    name: "the members’ app",
    blurb: "The same, on the screens behind the sign-in.",
  },
  {
    key: "back",
    name: "the back of the house",
    blurb:
      "The words in here. Almost nothing needs translating — only whoever is looking after the site ever reads them.",
  },
];

export type Said = (key: string) => string;

/**
 * What to say, in a language.
 *
 * `said` is whatever the back of the house has written down, by key. An empty
 * one is perfectly normal: the French in the list above is what the site says
 * until somebody changes it, and the English is what it says when there is no
 * French at all.
 */
export function speaking(lang: "en" | "fr", said: Record<string, string> = {}): Said {
  return (key: string) => {
    const phrase = BY_KEY.get(key);
    if (!phrase) return key;
    if (lang === "en") return phrase.en;
    return said[key]?.trim() || phrase.fr || phrase.en;
  };
}
