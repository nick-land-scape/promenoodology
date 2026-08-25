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
  { key: "on.partOf", en: "part of", fr: "fait partie de", where: "front", note: "Followed by the name of the project a single day belongs to." },
  /* And the working pair, for a member reading an evening on the website. The
     grey ones next to these are what everybody else sees. */
  { key: "part.saved", en: "Saved. It is on your profile.", fr: "Enregistré. C'est sur votre profil.", where: "front" },
  { key: "part.howMany", en: "How many of you", fr: "Combien serez-vous", where: "front" },
  { key: "part.bringing", en: "Bringing anything?", fr: "Vous apportez quelque chose ?", where: "front" },
  { key: "part.bringingHint", en: "A pot, a lift, a bottle — or nothing at all", fr: "Une casserole, une place en voiture, une bouteille — ou rien du tout", where: "front" },
  { key: "part.whichDays", en: "Which days can you make?", fr: "Quels jours pouvez-vous venir ?", where: "front", note: "Only for an evening with a programme of days." },
  { key: "part.send", en: "count me in", fr: "je viens", where: "front", note: "The button that sends the form." },
  { key: "part.sending", en: "sending…", fr: "envoi…", where: "front" },
  { key: "part.youAreComing", en: "You are coming to this one.", fr: "Vous venez à celle-ci.", where: "front" },

  /* The two lists on the website's own profile page: what you are coming to, and
     what you have kept an eye on. The app has had both for months. */
  { key: "mine.yourEvenings", en: "your evenings", fr: "vos soirées", where: "front" },
  { key: "mine.nothingBooked", en: "You have not said yes to anything yet, and nothing is on your list.", fr: "Vous n'avez encore dit oui à rien, et rien n'est sur votre liste.", where: "front" },
  { key: "mine.seeWhatsOn", en: "See what is on", fr: "Voir ce qui se passe", where: "front" },
  { key: "mine.youAreComingTo", en: "you are coming to", fr: "vous venez à", where: "front" },
  { key: "mine.onYourList", en: "kept on your list", fr: "gardé sur votre liste", where: "front" },

  /* The news page on the website, which is hidden until somebody turns it on. */
  { key: "news.orByEmail", en: "or have them by email", fr: "ou les recevoir par courriel", where: "front", note: "Links to the newsletter." },
  { key: "news.nothingYet", en: "Nothing written yet.", fr: "Rien d'écrit pour l'instant.", where: "front" },
  { key: "news.heldAtTheTop", en: "held at the top", fr: "en tête", where: "front", note: "The one item pinned above the rest." },
  { key: "news.theRest", en: "everything else", fr: "tout le reste", where: "front" },
  { key: "on.been", en: "and what has been", fr: "et ce qui a eu lieu", where: "front", note: "A heading over the evenings that have happened." },
  { key: "on.nothing", en: "Nothing is on just now. There will be.", fr: "Rien pour le moment. Cela viendra.", where: "front" },
  { key: "on.asMonth", en: "see it as a month", fr: "voir le mois", where: "front", note: "Shows the month instead of the list." },
  { key: "on.backToList", en: "back to the list", fr: "revenir à la liste", where: "front", note: "Shows the list again." },
  { key: "on.nextOn", en: "next on", fr: "prochainement le", where: "front", note: "Followed by a date: “next on 22 August”." },
  { key: "on.days", en: "days, from", fr: "jours, à partir du", where: "front", note: "As in “5 days, from 22 August”." },

  /* ------------------------------------------------------------- the calendar */
  { key: "cal.pressOne", en: "The marked days have something on. Press one.", fr: "Les jours marqués ont quelque chose. Appuyez sur l’un d’eux.", where: "front", note: "Under the month. Pressing a day opens its card." },
  {
    key: "cal.shutTheDay",
    en: "Close",
    fr: "Fermer",
    where: "front",
    note: "Read out for the cross that shuts the day's card in the month; not shown.",
  },
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
  { key: "event.takeAsPdf", en: "take it as a PDF ↓", fr: "télécharger le PDF ↓", where: "front" },
  { key: "event.lookThrough", en: "look through the flyer", fr: "feuilleter le flyer", where: "front", note: "Opens the flyer as a book." },
  { key: "event.inTheApp", en: "In the members’ app —", fr: "Dans l’app des membres —", where: "front" },
  { key: "event.places", en: "places", fr: "places", where: "front", note: "As in “, 20 places”." },
  { key: "event.whatsOn", en: "what’s on", fr: "ce qui se passe", where: "front", note: "The link into the members’ app." },

  /* ------------------------------------------------ taking part, on the website */
  { key: "part.countMeIn", en: "count me in", fr: "je viens", where: "front" },
  { key: "part.save", en: "save this evening", fr: "garder cette soirée", where: "front" },
  /* Said in this order on purpose: the welcome first, because "for members" next
     to a button is read as "this evening is for members", and it is not. Anybody
     can turn up. What needs an account is *telling us* you are coming, and the
     reason for that is a kitchen counting plates rather than a door policy. */
  { key: "eve.theWhole", en: "the whole programme", fr: "tout le programme", where: "app" },
  { key: "eve.theFile", en: "Apple, or any other", fr: "Apple, ou un autre", where: "app", note: "The .ics. On a phone this is the one that matters." },
  {
    key: "eve.whichIsWhich",
    en: "The file opens your own calendar with the evening ready to add.",
    fr: "Le fichier ouvre votre agenda avec la soirée prête à ajouter.",
    where: "app",
  },
  { key: "eve.addToCalendar", en: "put it in my calendar", fr: "l’ajouter à mon agenda", where: "app", note: "On an evening's own screen. Hands the phone an .ics file." },
  { key: "cal.addToCalendar", en: "add to my calendar", fr: "ajouter à mon agenda", where: "front", note: "Downloads an .ics file — every calendar takes one." },
  { key: "cal.whichDay", en: "which day?", fr: "quel jour ?", where: "front", note: "The first step of the calendar menu." },
  { key: "cal.back", en: "another day", fr: "un autre jour", where: "front", note: "Back to the first step." },
  { key: "eve.whichDay", en: "which day?", fr: "quel jour ?", where: "app" },
  { key: "eve.back", en: "another day", fr: "un autre jour", where: "app" },
  {
    key: "cal.theWhole",
    en: "the whole programme",
    fr: "tout le programme",
    where: "front",
    note: "The first row of the calendar menu: every day of it, in one file.",
  },
  {
    key: "cal.theFile",
    en: "Apple, or any other",
    fr: "Apple, ou un autre",
    where: "front",
    note: "The .ics, first in the menu: the only route for Apple, and it works everywhere.",
  },
  { key: "cal.outlook", en: "Outlook", fr: "Outlook", where: "front" },
  {
    key: "cal.whichIsWhich",
    en: "The file is the one for iPhone, Mac and Outlook on a desktop — it opens your calendar with the evening ready to add.",
    fr: "Le fichier est celui pour iPhone, Mac et Outlook sur ordinateur — il ouvre votre agenda avec la soirée prête à ajouter.",
    where: "front",
    note: "Under the three calendar links. Apple has no address that opens its calendar with an event in it; the file is that.",
  },
  { key: "cal.google", en: "Google Calendar", fr: "Google Agenda", where: "front", note: "Only for an evening that is one occasion; a programme goes as the file." },
  {
    key: "part.whyOff",
    en: "Switched off because you are not signed in. Anybody can come — saying so in advance needs an account.",
    fr: "Désactivé parce que vous n’êtes pas connecté. Tout le monde peut venir — le dire à l’avance demande un compte.",
    where: "front",
    note: "The panel that appears when somebody points at either greyed-out control.",
  },
  {
    key: "part.openToAll",
    en: "Everybody is welcome at this — you do not have to be a member to come.",
    fr: "Tout le monde est bienvenu — pas besoin d’être membre pour venir.",
    where: "front",
    note: "Under the count-me-in button, first line.",
  },
  {
    key: "part.needsAccount",
    en: "Saying so in advance needs an account, so the kitchen knows how many —",
    fr: "Le dire à l’avance demande un compte, pour que la cuisine sache combien —",
    where: "front",
    note: "Under the count-me-in button, second line, followed by the link to join.",
  },
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

  /* ------------------------------------------------------------------- a sheet */
  { key: "sheet.eyebrow", en: "do it yourself", fr: "faites-le vous-même", where: "front", note: "The small line above a sheet's title." },
  { key: "sheet.whatItTakes", en: "what it takes", fr: "ce qu’il faut", where: "front" },
  { key: "sheet.whatToDo", en: "what to do", fr: "quoi faire", where: "front" },
  { key: "sheet.andThen", en: "and then", fr: "et ensuite", where: "front", note: "Over the one thing a sheet asks for." },
  {
    key: "sheet.borrowed",
    en: "Borrowed beats bought, every time, and nothing on this list has to match anything else on it. Half of it is not cooking equipment: the chalk, the game, the one light and the spare seat are what turn a place into an evening.",
    fr: "Emprunté vaut toujours mieux qu’acheté, et rien sur cette liste n’a besoin d’aller avec le reste. La moitié n’est pas du matériel de cuisine : la craie, le jeu, la lampe et la chaise en trop sont ce qui transforme un lieu en soirée.",
    where: "front",
  },
  {
    key: "sheet.ask",
    en: "Send us a photograph of the people, not of the food. That is the whole ask — no forms, no affiliation, nothing to join. If you want a hand first, the",
    fr: "Envoyez-nous une photographie des gens, pas de la nourriture. C’est tout ce que nous demandons — pas de formulaire, pas d’adhésion, rien à rejoindre. Si vous voulez un coup de main d’abord, le",
    where: "front",
    note: "Followed by a link to the handbook.",
  },
  { key: "sheet.longVersion", en: "is the long version of this, and", fr: "en est la version longue, et", where: "front" },
  { key: "sheet.askingUs", en: "asking us", fr: "nous demander", where: "front", note: "A link." },
  { key: "sheet.costsNothing", en: "costs nothing.", fr: "ne coûte rien.", where: "front" },
  { key: "sheet.passItOn", en: "This page is meant to be passed on. Its address is", fr: "Cette page est faite pour être transmise. Son adresse est", where: "front" },
  {
    key: "sheet.somewhereElse",
    en: "Somewhere else, on a day like the one you are planning.",
    fr: "Ailleurs, un jour comme celui que vous préparez.",
    where: "front",
    note: "Under the photograph on a sheet.",
  },

  {
    key: "sheet.howManyStayed",
    en: "About {n} people stayed and ate.",
    fr: "Environ {n} personnes sont restées et ont mangé.",
    where: "front",
    note: "{n} is the number; leave it in.",
  },
  { key: "book.theHandbook", en: "handbook", fr: "manuel", where: "front", note: "The word, in a sentence, as a link." },

  /* ------------------------------------------------------------------ elsewhere */
  { key: "site.with", en: "with", fr: "avec", where: "front", note: "Over the partners' logos on the community page." },

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

  /* -------------------------------------------------------- the app: the tabs */
  { key: "tab.main", en: "Main", fr: "Principal", where: "app", note: "Read out by a screen reader for the bar along the bottom; not shown." },
  { key: "tab.home", en: "Home", fr: "Accueil", where: "app" },
  { key: "tab.whatsOn", en: "What’s on", fr: "À l’affiche", where: "app" },
  { key: "tab.read", en: "Read", fr: "Lire", where: "app" },
  { key: "tab.connect", en: "Connect", fr: "Rencontrer", where: "app" },
  { key: "tab.account", en: "Account", fr: "Compte", where: "app" },

  /* ------------------------------------------------------ the app: front screen */
  { key: "home.welcome", en: "welcome", fr: "bienvenue", where: "app", note: "The small line above “hello”." },
  { key: "home.hello", en: "hello", fr: "bonjour", where: "app", note: "On its own when we do not know the name." },
  { key: "home.helloName", en: "hello, {name}", fr: "bonjour, {name}", where: "app", note: "{name} is their first name. Keep {name} exactly as it is." },
  { key: "home.latestNews", en: "latest news", fr: "dernières nouvelles", where: "app" },
  { key: "home.keptAtTop", en: "kept at the top", fr: "épinglé", where: "app", note: "Beside the one note that is held above the others." },
  { key: "home.whatWeHaveDone", en: "what we have done", fr: "ce que nous avons fait", where: "app" },
  { key: "home.allOfThem", en: "all {n} ›", fr: "les {n} ›", where: "app", note: "{n} is a number. Opens the full list." },
  { key: "home.theHandbook", en: "the handbook", fr: "le manuel", where: "app" },
  { key: "home.readIt", en: "read it ›", fr: "le lire ›", where: "app" },
  { key: "home.addsUpTo", en: "what that adds up to", fr: "ce que cela représente", where: "app", note: "Over the plates, places, countries and years." },
  { key: "home.plates", en: "plates", fr: "assiettes", where: "app" },
  { key: "home.intervention", en: "intervention", fr: "intervention", where: "app", note: "One of them." },
  { key: "home.interventions", en: "interventions", fr: "interventions", where: "app", note: "More than one." },
  { key: "home.place", en: "place", fr: "lieu", where: "app", note: "One of them." },
  { key: "home.places", en: "places", fr: "lieux", where: "app", note: "More than one. Places on a map, not seats at a table." },
  { key: "home.countries", en: "countries", fr: "pays", where: "app" },
  { key: "home.years", en: "years", fr: "années", where: "app" },
  {
    key: "home.whatItIsFor",
    en: "Public space in Europe is turning generic. This is what a bit of nerve and a borrowed kitchen has done about it so far.",
    fr: "L’espace public européen s’uniformise. Voilà ce qu’un peu d’audace et une cuisine empruntée y ont changé jusqu’ici.",
    where: "app",
    note: "Under the figures.",
  },
  { key: "by.one", en: "by {names}", fr: "par {names}", where: "app", note: "Who wrote a note. Keep {names} exactly as it is." },
  { key: "by.and", en: "and", fr: "et", where: "app", note: "Joins the last two names: “by Nick, Gabriel and Carla”." },

  /* ------------------------------------------- the app: what is coming up */
  { key: "up.comingUp", en: "what is coming up", fr: "ce qui arrive", where: "app" },
  { key: "up.event", en: "event", fr: "événement", where: "app", note: "One of them, after a number." },
  { key: "up.events", en: "events", fr: "événements", where: "app", note: "More than one, after a number." },
  { key: "up.whichPlace", en: "Which place", fr: "Quel lieu", where: "app", note: "Read out by a screen reader over the row of places; not shown." },
  { key: "up.everywhere", en: "everywhere", fr: "partout", where: "app", note: "The chip that stops narrowing by place." },
  { key: "up.nothingHere", en: "Nothing here yet. Try everywhere.", fr: "Rien ici pour l’instant. Essayez « partout ».", where: "app" },

  /* ---------------------------------------------- the app: the header of a screen */
  { key: "head.back", en: "Back", fr: "Retour", where: "app", note: "Read out by a screen reader for the arrow, top left; not shown." },

  /* -------------------------------------------------- the app: the what’s on screen */
  { key: "on.eyebrow", en: "what’s on", fr: "à l’affiche", where: "app", note: "The small line above the title." },
  { key: "on.whatToJoin", en: "what would you like to join?", fr: "à quoi voulez-vous participer ?", where: "app" },

  /* ------------------------------------------------ the app: one evening, in a row */
  { key: "row.with", en: "with", fr: "avec", where: "app", note: "Before the partners' names on a row." },
  { key: "row.stillWanted", en: "still wanted", fr: "encore nécessaire", where: "app", note: "Over what people could bring." },
  { key: "row.comingWith", en: "coming with", fr: "apporte", where: "app", note: "Over what people are already bringing." },
  { key: "row.youAreComing", en: "you are coming,", fr: "vous venez,", where: "app", note: "Followed by a number of places." },
  { key: "row.place", en: "place", fr: "place", where: "app", note: "One seat at the table." },
  { key: "row.places", en: "places", fr: "places", where: "app", note: "More than one seat at the table." },
  { key: "row.withGuests", en: "with", fr: "avec", where: "app", note: "Before the names of the people they are bringing." },
  { key: "row.keptForYou", en: "kept for you", fr: "réservé pour vous", where: "app" },
  { key: "row.notThisTime", en: "not this time", fr: "pas cette fois", where: "app", note: "Their request was turned down." },
  { key: "row.onYourList", en: "on your list", fr: "dans votre liste", where: "app" },
  { key: "row.notComing", en: "not coming", fr: "je ne viens plus", where: "app", note: "The button that gives a place back." },
  { key: "row.countMeIn", en: "count me in", fr: "j’en suis", where: "app", note: "The button that takes a place." },
  { key: "row.pickYourDays", en: "pick your days", fr: "choisissez vos jours", where: "app", note: "For an evening with a programme of days: a place is taken on a day, not on the whole run." },
  { key: "row.changeDays", en: "change the days", fr: "changer les jours", where: "app" },
  { key: "row.changeIt", en: "change it", fr: "modifier", where: "app", note: "Change how many places, or what you are bringing." },
  { key: "row.comingOnDays", en: "you are coming on {n} of {all} days", fr: "vous venez {n} jours sur {all}", where: "app" },
  { key: "row.daysToChooseFrom", en: "{n} days to choose from", fr: "{n} jours au choix", where: "app", note: "The badge on an evening that has a programme inside it." },
  { key: "row.didNotWork", en: "That did not work.", fr: "Cela n’a pas fonctionné.", where: "app" },
  { key: "row.takenOff", en: "Taken off. Sign up again whenever you like.", fr: "Retiré. Reprenez une place quand vous voulez.", where: "app" },
  { key: "row.countMeIn", en: "count me in", fr: "je viens", where: "app" },
  { key: "row.takeOffList", en: "Take it off your list", fr: "Retirer de votre liste", where: "app", note: "The bookmark, when it is already marked." },
  { key: "row.keepOnList", en: "Keep it on your list", fr: "Garder dans votre liste", where: "app", note: "The bookmark, when it is not." },

  /* --------------------------------------- the app: signing up for an evening */
  { key: "join.howToLook", en: "How to look at it", fr: "Comment l’afficher", where: "app", note: "Read out by a screen reader over the list/month switch; not shown." },
  { key: "join.whatsNext", en: "what’s next", fr: "la suite", where: "app", note: "The list, as against the month." },
  { key: "join.byMonth", en: "by month", fr: "par mois", where: "app" },
  { key: "join.stillToCome", en: "still to come", fr: "encore à venir", where: "app" },
  { key: "join.evening", en: "evening", fr: "soirée", where: "app", note: "One of them, after a number." },
  { key: "join.evenings", en: "evenings", fr: "soirées", where: "app", note: "More than one, after a number." },
  { key: "join.nothingToCome", en: "Nothing to come to just yet. It goes up here the moment there is.", fr: "Rien à quoi participer pour l’instant. Cela apparaîtra ici dès qu’il y aura quelque chose.", where: "app" },
  { key: "join.alreadyHappened", en: "already happened", fr: "déjà passé", where: "app" },
  { key: "join.youWereThere", en: "you were there", fr: "vous y étiez", where: "app" },
  { key: "join.readIt", en: "read it", fr: "le lire", where: "app", note: "Opens the story written about an evening afterwards." },
  { key: "join.didNotGoThrough", en: "That did not go through.", fr: "Cela n’a pas fonctionné.", where: "app", note: "When signing up failed and the server said nothing useful." },
  { key: "join.didNotWork", en: "That did not work.", fr: "Cela n’a pas fonctionné.", where: "app" },
  { key: "join.youAreDownFor", en: "You are down for {n} {places}.", fr: "Vous êtes inscrit·e pour {n} {places}.", where: "app", note: "{n} is a number and {places} is the word below. Keep both exactly as they are." },
  { key: "join.takenOff", en: "Taken off. Sign up again whenever you like.", fr: "C’est annulé. Vous pouvez vous réinscrire quand vous voulez.", where: "app" },
  { key: "join.reallyNotComing", en: "Say you are not coming to “{title}” after all?", fr: "Annuler votre venue à « {title} » ?", where: "app", note: "The phone asks this before giving a place back. Keep {title} exactly as it is." },

  /* ----------------------------------------------------- the app: the month */
  { key: "month.before", en: "The month before", fr: "Le mois précédent", where: "app", note: "Read out by a screen reader; not shown." },
  { key: "month.after", en: "The month after", fr: "Le mois suivant", where: "app", note: "Read out by a screen reader; not shown." },
  { key: "month.weekLetters", en: "M T W T F S S", fr: "L M M J V S D", where: "app", note: "The initials of the seven days, Monday first, separated by single spaces." },
  { key: "month.howManyOn", en: "{n} on", fr: "{n} ce jour-là", where: "app", note: "Read out for a day with something on it. Keep {n} exactly as it is." },
  { key: "month.nothingOn", en: "nothing on", fr: "rien ce jour-là", where: "app", note: "Read out for an empty day." },
  { key: "month.nothingThatDay", en: "Nothing on that day. The marked ones have something.", fr: "Rien ce jour-là. Les jours marqués ont quelque chose.", where: "app" },

  /* ------------------------------------------------- the app: the join pop-up */
  { key: "sheet.whichDays", en: "which days", fr: "quels jours", where: "app", note: "The first question for an evening with a programme: nobody comes to a whole month." },
  { key: "sheet.howMany", en: "how many of you", fr: "combien êtes-vous", where: "app" },
  { key: "sheet.whoWith", en: "who with you", fr: "qui vous accompagne", where: "app", note: "Asked when they are bringing one person." },
  { key: "sheet.andNumber", en: "and number {n}", fr: "et la personne {n}", where: "app", note: "Asked for each further person. Keep {n} exactly as it is." },
  { key: "sheet.firstNamePlenty", en: "a first name is plenty", fr: "un prénom suffit", where: "app", note: "The grey text in an empty name field." },
  { key: "sheet.bringing", en: "bringing", fr: "j’apporte", where: "app" },
  { key: "sheet.bringingEg", en: "a pot, a salad, a speaker…", fr: "une marmite, une salade, une enceinte…", where: "app", note: "The grey text in the empty field." },
  { key: "sheet.anythingWelcome", en: "What is still wanted is listed on the evening. Anything else is welcome anyway.", fr: "Ce qui manque encore est indiqué sur la soirée. Tout le reste est bienvenu aussi.", where: "app" },
  { key: "sheet.signingUp", en: "signing you up…", fr: "inscription en cours…", where: "app" },
  { key: "sheet.yesComing", en: "yes, I am coming", fr: "oui, je viens", where: "app" },
  { key: "sheet.altogether", en: "{n} places altogether.", fr: "{n} places en tout.", where: "app", note: "Keep {n} exactly as it is." },
  { key: "sheet.close", en: "Close", fr: "Fermer", where: "app", note: "Read out for the cross that shuts a pop-up." },

  /* ----------------------------------------- the app: one evening, in full */
  { key: "eve.everythingOn", en: "everything on", fr: "tout le programme", where: "app", note: "Back to the list of evenings." },
  { key: "eve.youAreComing", en: "you are coming", fr: "vous venez", where: "app" },
  { key: "eve.takenOff", en: "Taken off. Come anyway if the day turns out differently.", fr: "C’est annulé. Venez quand même si la journée en décide autrement.", where: "app" },
  { key: "eve.itHasBeen", en: "It has been. What is here is what it was.", fr: "C’est passé. Ce qui est ici est ce que c’était.", where: "app" },
  { key: "eve.programme", en: "the programme", fr: "le programme", where: "app" },
  { key: "eve.stillWanted", en: "still wanted", fr: "encore nécessaire", where: "app" },
  { key: "eve.comingWith", en: "coming with", fr: "apporté par", where: "app" },
  { key: "eve.practicalBits", en: "the practical bits", fr: "en pratique", where: "app" },
  { key: "eve.orWriteTo", en: "or write to", fr: "ou écrivez à", where: "app" },
  { key: "eve.with", en: "with", fr: "avec", where: "app", note: "Before the partners' names." },
  { key: "eve.partOf", en: "part of", fr: "dans le cadre de", where: "app" },
  { key: "eve.ate", en: "ate", fr: "repas servis", where: "app", note: "After a number: “120 ate”." },
  { key: "eve.readWhatCame", en: "read what came of it", fr: "lire ce qui en est sorti", where: "app" },

  /* ------------------------------------------------------- the app: reading */
  { key: "read.eyebrow", en: "read", fr: "lire", where: "app", note: "The small line above the title." },
  { key: "read.whatWeHaveDone", en: "what we have done", fr: "ce que nous avons fait", where: "app" },
  { key: "read.whatToRead", en: "What to read", fr: "Quoi lire", where: "app", note: "Read out by a screen reader over the three-way switch; not shown." },
  { key: "read.stories", en: "stories", fr: "récits", where: "app" },
  { key: "read.archive", en: "archive", fr: "archive", where: "app" },
  { key: "read.handbook", en: "handbook", fr: "manuel", where: "app" },
  { key: "read.storiesHow", en: "Stories how", fr: "Affichage des récits", where: "app", note: "Read out by a screen reader over “as a list / on the map”; not shown." },
  { key: "read.asAList", en: "as a list", fr: "en liste", where: "app" },
  { key: "read.onTheMap", en: "on the map", fr: "sur la carte", where: "app" },
  { key: "read.everyPhotograph", en: "every photograph", fr: "toutes les photographies", where: "app" },
  { key: "read.whichYear", en: "Which year", fr: "Quelle année", where: "app", note: "Read out by a screen reader over the row of years; not shown." },
  { key: "read.shuffle", en: "shuffle", fr: "mélanger", where: "app", note: "Deals the photographs again in another order." },
  { key: "read.everyYear", en: "every year", fr: "toutes les années", where: "app" },
  { key: "read.open", en: "Open", fr: "Ouvrir", where: "app", note: "Read out for a photograph on the wall; not shown." },
  { key: "read.putOneOn", en: "put one on yourself", fr: "organisez la vôtre", where: "app" },
  { key: "read.putOneOnUnder", en: "one sheet per kind of place, for getting strangers into the same place", fr: "une fiche par type de lieu, pour réunir des inconnus au même endroit", where: "app" },

  /* ------------------------------------------------- the app: your membership */
  { key: "acc.eyebrow", en: "you", fr: "vous", where: "app", note: "The small line above the title." },
  { key: "acc.yourMembership", en: "your membership", fr: "votre adhésion", where: "app" },
  { key: "acc.youSaidYesTo", en: "you said yes to", fr: "vous avez dit oui à", where: "app" },
  { key: "acc.nothingYet", en: "Nothing yet.", fr: "Rien pour l’instant.", where: "app" },
  { key: "acc.haveALook", en: "Have a look at what is on", fr: "Voyez ce qui se passe", where: "app", note: "A link, straight after “Nothing yet.”" },
  { key: "acc.bringing", en: "bringing", fr: "apporte", where: "app", note: "Followed by what they said they would bring." },
  { key: "acc.personalInformation", en: "your personal information", fr: "vos informations personnelles", where: "app" },
  { key: "acc.waysToSignIn", en: "ways to sign in", fr: "façons de se connecter", where: "app" },
  { key: "acc.getInTouch", en: "get in touch, or report a bug", fr: "nous écrire, ou signaler un problème", where: "app" },
  { key: "acc.inWriting", en: "in writing", fr: "les textes officiels", where: "app", note: "Over the four legal pages." },
  { key: "acc.help", en: "help", fr: "aide", where: "app" },
  { key: "acc.privacy", en: "what we do with your data", fr: "ce que nous faisons de vos données", where: "app" },
  { key: "acc.terms", en: "terms and conditions", fr: "conditions générales", where: "app" },
  { key: "acc.childSafety", en: "keeping children safe", fr: "protéger les enfants", where: "app", note: "The standards Google Play asks every social app to publish." },
  { key: "acc.imprint", en: "imprint", fr: "mentions légales", where: "app" },
  { key: "acc.signOut", en: "sign out", fr: "se déconnecter", where: "app" },

  /* ------------------------------------------------------ the app: connect */
  { key: "con.eyebrow", en: "connect", fr: "rencontrer", where: "app", note: "The small line above the title." },
  { key: "con.whatEveryone", en: "what everyone is up to", fr: "ce que tout le monde fait", where: "app" },
  { key: "con.switch", en: "Connect", fr: "Rencontrer", where: "app", note: "Read out by a screen reader over the feed/people switch; not shown." },
  { key: "con.feed", en: "feed", fr: "fil", where: "app", note: "What everybody has posted." },
  { key: "con.people", en: "people", fr: "les gens", where: "app", note: "The list of members." },
  { key: "con.nothingYet", en: "Nothing here yet. Say the first thing.", fr: "Rien ici pour l’instant. Dites la première chose.", where: "app" },
  { key: "con.whoIsAround", en: "who is around", fr: "qui est là", where: "app" },
  { key: "con.howManyPeople", en: "people", fr: "personnes", where: "app", note: "After a number: “64 people”." },
  { key: "con.wave", en: "wave", fr: "faire signe", where: "app", note: "A wave is the whole message: no subject, no words." },
  { key: "con.waved", en: "waved", fr: "signe envoyé", where: "app" },
  { key: "con.you", en: "you", fr: "vous", where: "app", note: "In the circle where somebody’s initials go, when we have no name." },

  /* -------------------------------------------- the app: saying something */
  { key: "post.sayToEveryone", en: "say something to everyone…", fr: "dites quelque chose à tout le monde…", where: "app", note: "The grey text in the empty field." },
  { key: "post.writeAPost", en: "Write a post", fr: "Écrire un message", where: "app", note: "Read out by a screen reader; not shown." },
  { key: "post.saySomething", en: "say something", fr: "dites quelque chose", where: "app", note: "The pop-up’s own title." },
  { key: "post.everybodySees", en: "Everybody in the club sees this. No likes, only replies.", fr: "Tout le club voit ceci. Pas de « j’aime », seulement des réponses.", where: "app" },
  { key: "post.takePictureOff", en: "Take this picture off", fr: "Retirer cette image", where: "app" },
  { key: "post.addPictures", en: "Add pictures", fr: "Ajouter des images", where: "app" },
  { key: "post.where", en: "where?", fr: "où ?", where: "app", note: "The grey text in the empty field." },
  { key: "post.whereLabel", en: "Where", fr: "Où", where: "app", note: "Read out by a screen reader; not shown." },
  { key: "post.posting", en: "posting…", fr: "envoi…", where: "app" },
  { key: "post.post", en: "post", fr: "publier", where: "app" },
  { key: "post.didNotGoUp", en: "That did not go up.", fr: "Cela n’a pas été publié.", where: "app" },
  { key: "post.takeItDown", en: "take it down", fr: "supprimer", where: "app" },
  { key: "post.reallyTakeDown", en: "Take this down? The pictures go with it.", fr: "Supprimer ceci ? Les images partent avec.", where: "app", note: "The phone asks this before deleting a post." },
  { key: "post.reply", en: "reply", fr: "répondre", where: "app", note: "When there are none yet." },
  { key: "post.oneReply", en: "reply", fr: "réponse", where: "app", note: "After the number 1." },
  { key: "post.manyReplies", en: "replies", fr: "réponses", where: "app", note: "After a number greater than one." },
  { key: "post.answerName", en: "answer {name}…", fr: "répondre à {name}…", where: "app", note: "The grey text in the reply field. Keep {name} exactly as it is." },
  { key: "post.yourReply", en: "Your reply", fr: "Votre réponse", where: "app", note: "Read out by a screen reader; not shown." },
  { key: "post.send", en: "send", fr: "envoyer", where: "app" },

  /* Reporting something, and blocking somebody — the two things a member can do
     about another member. Written plainly and without heat: whoever is reading
     these words is already annoyed, and a screen that shares the feeling is a
     screen that makes it worse. */
  { key: "report.report", en: "report", fr: "signaler", where: "app", note: "On somebody else's post, and at the end of a reply." },
  { key: "report.whatIsWrong", en: "What is wrong?", fr: "Qu'est-ce qui ne va pas ?", where: "app", note: "The heading of the sheet." },
  { key: "report.somebodyWillLook", en: "It goes to the people who run the club. Nothing disappears on one report.", fr: "Cela va aux personnes qui gèrent le club. Rien ne disparaît sur un seul signalement.", where: "app" },
  { key: "report.why", en: "Because", fr: "Parce que", where: "app" },
  { key: "report.abuse", en: "It is abusive, or aimed at somebody", fr: "C'est abusif, ou visant quelqu'un", where: "app" },
  { key: "report.notTrue", en: "It is not true", fr: "Ce n'est pas vrai", where: "app" },
  { key: "report.notTheirs", en: "It is not theirs to post", fr: "Ce n'est pas à eux de le publier", where: "app", note: "Somebody else's photograph or words." },
  { key: "report.notOurs", en: "It has nothing to do with the club", fr: "Cela n'a rien à voir avec le club", where: "app" },
  { key: "report.somethingElse", en: "Something else", fr: "Autre chose", where: "app" },
  { key: "report.anythingElse", en: "Anything you want to add", fr: "Ce que vous voulez ajouter", where: "app" },
  { key: "report.inYourWords", en: "In your own words. It helps.", fr: "Dans vos propres mots. Cela aide.", where: "app" },
  { key: "report.sendIt", en: "send it", fr: "envoyer", where: "app" },
  { key: "report.thankYou", en: "Thank you — somebody will look at it.", fr: "Merci — quelqu'un va regarder.", where: "app" },
  { key: "report.orBlock", en: "Or settle it yourself: block {name} and you will not see each other on the feed. They are not told, and you can undo it in your account.", fr: "Ou réglez-le vous-même : bloquez {name} et vous ne vous verrez plus sur le fil. La personne n'en est pas informée, et vous pouvez annuler depuis votre compte.", where: "app", note: "Keep {name} exactly as it is." },
  { key: "report.beDoneWith", en: "block {name}", fr: "bloquer {name}", where: "app", note: "Keep {name} exactly as it is." },
  { key: "report.blockThem", en: "yes, block {name}", fr: "oui, bloquer {name}", where: "app", note: "Keep {name} exactly as it is." },
  { key: "report.neverMind", en: "never mind", fr: "annuler", where: "app" },
  { key: "report.blocked", en: "{name} is blocked. Undo it in your account.", fr: "{name} est bloqué. Annulez dans votre compte.", where: "app", note: "Keep {name} exactly as it is." },

  /* The two marks at the top right of anything you wrote. Read out by a screen
     reader and shown as a tooltip; the buttons themselves are drawings. */
  { key: "mine.editThis", en: "Change {what}", fr: "Modifier {what}", where: "app", note: "Keep {what} exactly as it is." },
  { key: "mine.takeThisDown", en: "Take {what} down", fr: "Retirer {what}", where: "app", note: "Keep {what} exactly as it is." },
  { key: "mine.reallyTakeDown", en: "Press again to take {what} down", fr: "Appuyez encore pour retirer {what}", where: "app", note: "The second press. Keep {what} exactly as it is." },
  { key: "mine.thisPost", en: "this post", fr: "ce message", where: "app" },
  { key: "mine.thisIdea", en: "this suggestion", fr: "cette suggestion", where: "app" },
  { key: "mine.thisReply", en: "this reply", fr: "cette réponse", where: "app" },

  /* What the club should do next, according to the club. The middle tab of
     Connect: a sentence anybody can write, and a number anybody can add to. */
  { key: "con.ideas", en: "ideas", fr: "idées", where: "app", note: "The middle tab of Connect." },
  { key: "idea.yours", en: "Your suggestion", fr: "Votre suggestion", where: "app", note: "Read out by a screen reader; not shown." },
  { key: "idea.placeholder", en: "Something the club should do…", fr: "Quelque chose que le club devrait faire…", where: "app" },
  { key: "idea.suggestIt", en: "suggest it", fr: "proposer", where: "app" },
  { key: "idea.thankYou", en: "Up it goes. The club answers the ones people agree with.", fr: "C'est en ligne. Le club répond à celles que les gens soutiennent.", where: "app" },
  { key: "idea.nothingYet", en: "Nothing suggested yet. Be the one.", fr: "Aucune suggestion pour l'instant. Lancez-vous.", where: "app" },
  { key: "idea.agree", en: "I would like this too", fr: "Moi aussi j'aimerais ça", where: "app", note: "Read out for the count, which is the button." },
  { key: "idea.youAgree", en: "You are one of them — press to take it back", fr: "Vous en faites partie — appuyez pour retirer", where: "app" },
  { key: "idea.theClubSays", en: "The club:", fr: "Le club :", where: "app", note: "Before the one answer an idea gets." },
  { key: "idea.open", en: "open", fr: "ouverte", where: "app" },
  { key: "idea.doing", en: "we are doing it", fr: "on s'en occupe", where: "app" },
  { key: "idea.done", en: "done", fr: "faite", where: "app" },
  { key: "idea.notNow", en: "not now", fr: "pas pour l'instant", where: "app", note: "A real answer, and it has to be sayable." },
  { key: "idea.answerIt", en: "answer this", fr: "répondre", where: "app", note: "Admins only." },
  { key: "idea.changeAnswer", en: "change the answer", fr: "modifier la réponse", where: "app" },
  { key: "idea.answerHint", en: "What the club has decided, and why", fr: "Ce que le club a décidé, et pourquoi", where: "app" },
  { key: "idea.saveAnswer", en: "save", fr: "enregistrer", where: "app" },
  { key: "idea.removeAnswer", en: "take the answer back", fr: "retirer la réponse", where: "app", note: "Clears the words and puts the suggestion back to open." },
  { key: "idea.takeItDown", en: "take it down", fr: "retirer", where: "app" },
  { key: "idea.reallyTakeDown", en: "yes, take it down", fr: "oui, retirer", where: "app", note: "The second press. The first one only asks." },
  { key: "idea.suggestSomething", en: "Suggest something", fr: "Proposer quelque chose", where: "app", note: "The heading of the sheet it opens." },
  { key: "idea.everybodyVotes", en: "Everybody in the club sees it, and can say they would like it too.", fr: "Tout le club la voit et peut dire qu'il aimerait ça aussi.", where: "app" },
  { key: "idea.editIt", en: "edit", fr: "modifier", where: "app", note: "Your own suggestion." },
  { key: "idea.saveEdit", en: "save", fr: "enregistrer", where: "app" },
  { key: "idea.edited", en: "edited", fr: "modifié", where: "app", note: "On something that has been changed since it was written." },
  { key: "idea.didNotWork", en: "That did not go through.", fr: "Cela n'a pas fonctionné.", where: "app" },

  /* What has been reported, on a phone, for whoever holds the keys. */
  { key: "flag.eyebrow", en: "for admins", fr: "pour les admins", where: "app" },
  { key: "flag.reported", en: "what has been reported", fr: "ce qui a été signalé", where: "app" },
  { key: "flag.notSetUp", en: "Not set up yet — the reports table is not in the database.", fr: "Pas encore en place — la table des signalements n'est pas dans la base.", where: "app", note: "Until migration 0041 has been run." },
  { key: "flag.nothingWaiting", en: "Nothing waiting. Which is the usual state of it.", fr: "Rien en attente. Ce qui est l'état habituel.", where: "app" },
  { key: "flag.onTheWayIn", en: "flagged on the way in", fr: "signalé à la publication", where: "app", note: "Nobody reported it — it was the screening." },
  { key: "flag.reportedBy", en: "reported by", fr: "signalé par", where: "app" },
  { key: "flag.writtenBy", en: "written by", fr: "écrit par", where: "app" },
  { key: "flag.gone", en: "Gone already — either its author took it down or it was removed.", fr: "Déjà supprimé — soit par son auteur, soit ici.", where: "app" },
  { key: "flag.itIsFine", en: "it is fine", fr: "c'est bon", where: "app" },
  { key: "flag.takeItDown", en: "take it down", fr: "supprimer", where: "app" },
  { key: "flag.reallyTakeItDown", en: "yes, take it down", fr: "oui, supprimer", where: "app" },
  { key: "flag.somebody", en: "somebody", fr: "quelqu'un", where: "app", note: "Where a name cannot be looked up." },

  /* And the list of them, in the account. A block you cannot find again is a
     block somebody has to leave the club to undo. */
  { key: "block.whoYouBlocked", en: "people you have blocked", fr: "personnes que vous avez bloquées", where: "app" },
  { key: "block.nobody", en: "Nobody. Which is the usual answer.", fr: "Personne. Ce qui est la réponse habituelle.", where: "app" },
  { key: "block.undo", en: "unblock", fr: "débloquer", where: "app" },
  { key: "block.what", en: "Neither of you sees the other on the feed. They were not told.", fr: "Aucun de vous deux ne voit l'autre sur le fil. La personne n'en a pas été informée.", where: "app" },

  /* --------------------------------------------------- the app: the door */
  { key: "door.joinUs", en: "join us", fr: "nous rejoindre", where: "app" },
  { key: "door.welcomeBack", en: "welcome back", fr: "bon retour", where: "app" },
  { key: "door.yourEmail", en: "your email", fr: "votre adresse e-mail", where: "app" },
  { key: "door.emailEg", en: "you@wherever.com", fr: "vous@quelquepart.com", where: "app", note: "The grey text in the empty field." },
  { key: "door.sending", en: "sending…", fr: "envoi…", where: "app" },
  { key: "door.lettingYouIn", en: "letting you in…", fr: "connexion…", where: "app" },
  { key: "door.sendMeACode", en: "send me a code", fr: "envoyez-moi un code", where: "app" },
  { key: "door.or", en: "or", fr: "ou", where: "app", note: "Between the code and Apple." },
  { key: "door.askingApple", en: "asking Apple…", fr: "connexion à Apple…", where: "app" },
  { key: "door.signUpApple", en: "Sign up with Apple", fr: "S’inscrire avec Apple", where: "app", note: "Apple’s own wording. Use whatever Apple uses in French." },
  { key: "door.signInApple", en: "Sign in with Apple", fr: "Se connecter avec Apple", where: "app", note: "Apple’s own wording. Use whatever Apple uses in French." },
  { key: "door.beenHereBefore", en: "I have been here before", fr: "j’ai déjà un compte", where: "app" },
  { key: "door.noAccountYet", en: "I have no account yet", fr: "je n’ai pas encore de compte", where: "app" },
  { key: "door.checkInbox", en: "check your inbox", fr: "regardez vos e-mails", where: "app" },
  { key: "door.theCode", en: "the code", fr: "le code", where: "app" },
  { key: "door.sendAnother", en: "send another", fr: "en renvoyer un", where: "app" },
  { key: "door.sendAnotherIn", en: "another in {n}s", fr: "un autre dans {n}s", where: "app", note: "The wait before a second code can be asked for. Keep {n} exactly as it is." },
  { key: "door.differentAddress", en: "use a different address", fr: "changer d’adresse", where: "app" },
  { key: "door.codeOnItsWay", en: "If {email} is one of ours, a code is on its way. Have a look in your spam folder too — the first one often lands there.", fr: "Si {email} est bien chez nous, un code est en route. Regardez aussi dans vos spams : le premier y atterrit souvent.", where: "app", note: "Keep {email} exactly as it is. It deliberately does not say whether the address has an account — see TheWayIn." },
  { key: "door.emailPlease", en: "Your email address, please.", fr: "Votre adresse e-mail, s’il vous plaît.", where: "app" },
  { key: "door.appleNotOn", en: "Sign in with Apple is not switched on yet.", fr: "La connexion avec Apple n’est pas encore activée.", where: "app" },
  { key: "door.noNewCode", en: "No new code just yet — too many have been asked for. If you already have one, it still works.", fr: "Pas de nouveau code pour l’instant : trop de demandes. Si vous en avez déjà un, il fonctionne toujours.", where: "app" },
  { key: "door.tryAgainMoment", en: "That did not work. Try again in a moment.", fr: "Cela n’a pas fonctionné. Réessayez dans un instant.", where: "app" },
  { key: "door.noAccountThere", en: "There is no account with that address yet. Join us instead — it is one press below.", fr: "Aucun compte à cette adresse. Rejoignez-nous plutôt : c’est le bouton juste en dessous.", where: "app", note: "No longer shown while signing in — saying it there tells anybody with a list of addresses which of them are members. Kept for the joining side, where it is an answer about your own address." },
  { key: "door.alreadyAnAccount", en: "There is already an account here. Sign in instead.", fr: "Un compte existe déjà ici. Connectez-vous plutôt.", where: "app" },
  { key: "door.tooManyCodes", en: "That is a lot of codes in a short time. Give it a minute.", fr: "Beaucoup de codes en peu de temps. Attendez une minute.", where: "app" },
  { key: "door.codeWrong", en: "That code is wrong, or it has been used already. Ask for a new one.", fr: "Ce code est erroné, ou déjà utilisé. Demandez-en un nouveau.", where: "app" },

  /* ------------------------------------------- the app: who you are, the form */
  { key: "me.anotherPortrait", en: "Choose another portrait", fr: "Choisir un autre portrait", where: "app" },
  { key: "me.addAPortrait", en: "Add a portrait", fr: "Ajouter un portrait", where: "app" },
  { key: "me.addPortraitPlain", en: "add a portrait", fr: "ajouter un portrait", where: "app", note: "Inside the empty circle where a face would be." },
  { key: "me.puttingItUp", en: "putting it up…", fr: "envoi…", where: "app" },
  { key: "me.change", en: "change", fr: "changer", where: "app" },
  { key: "me.add", en: "add", fr: "ajouter", where: "app" },
  { key: "me.faceOnCommunity", en: "A face on the community page. Optional, like everything under it.", fr: "Un visage sur la page communauté. Facultatif, comme tout ce qui suit.", where: "app" },
  { key: "me.yourName", en: "your name", fr: "votre nom", where: "app" },
  { key: "me.whatTheyCallYou", en: "what everybody calls you", fr: "comme tout le monde vous appelle", where: "app" },
  { key: "me.whereYouAre", en: "the town or city you are in", fr: "la ville où vous êtes", where: "app", note: "Deliberately not “where you are”: asked that way, people answer with a country and the country field goes empty." },
  { key: "me.cityEg", en: "Zürich", fr: "Genève", where: "app", note: "An example city in the empty field." },
  { key: "me.andCountry", en: "and the country", fr: "et le pays", where: "app", note: "Directly under the town, so “and” is doing real work — it says there are two of them." },
  { key: "me.countryEg", en: "Switzerland", fr: "Suisse", where: "app", note: "An example country in the empty field." },
  { key: "me.whatYouDo", en: "what you do", fr: "ce que vous faites", where: "app" },
  { key: "me.whatYouDoEg", en: "architecture student, cook, carpenter…", fr: "étudiant·e en architecture, cuisinier·ère, menuisier·ère…", where: "app" },
  { key: "me.whatYouBring", en: "what you can bring", fr: "ce que vous pouvez apporter", where: "app" },
  { key: "me.whatYouBringEg", en: "welding, a van, sourdough, Romanian bureaucracy", fr: "la soudure, une camionnette, le levain, la bureaucratie roumaine", where: "app" },
  { key: "me.commasBetween", en: "Commas between them. This is the one people actually search.", fr: "Séparez par des virgules. C’est le champ que les gens cherchent vraiment.", where: "app" },
  { key: "me.languages", en: "languages", fr: "langues", where: "app", note: "What you speak, not what you read us in." },
  { key: "me.languagesEg", en: "German, English, a little Italian", fr: "allemand, anglais, un peu d’italien", where: "app" },
  { key: "me.birthday", en: "birthday", fr: "anniversaire", where: "app" },
  { key: "me.birthdayEg", en: "7.11", fr: "7.11", where: "app", note: "A day and a month, in the order the language writes them." },
  
  { key: "me.letOthersSee", en: "let the others see it", fr: "laisser les autres le voir", where: "app" },
  { key: "me.instagram", en: "instagram", fr: "instagram", where: "app" },
  { key: "me.withoutTheAt", en: "without the @", fr: "sans le @", where: "app" },
  { key: "me.onlyForUs", en: "only for us", fr: "seulement pour nous", where: "app" },
  { key: "me.onlyForUsNote", en: "Never on the community page and never in the app: these two are read by whoever is cooking, and by nobody else.", fr: "Jamais sur la page communauté ni dans l’app : ces deux champs sont lus par les personnes qui cuisinent, et par personne d’autre.", where: "app" },
  { key: "me.cannotEat", en: "what you cannot eat", fr: "ce que vous ne pouvez pas manger", where: "app" },
  { key: "me.cannotEatEg", en: "no nuts, no pork", fr: "pas de fruits à coque, pas de porc", where: "app" },
  { key: "me.numberForDay", en: "a number for the day", fr: "un numéro pour le jour même", where: "app" },
  { key: "me.numberForDayEg", en: "for the afternoon of an evening, not for a list", fr: "pour l’après-midi d’une soirée, pas pour une liste de diffusion", where: "app" },
  { key: "me.putMeOnCommunity", en: "put me on the community page", fr: "m’afficher sur la page communauté", where: "app" },
  { key: "me.saving", en: "saving…", fr: "enregistrement…", where: "app" },
  { key: "me.thatIsMe", en: "that is me", fr: "c’est bien moi", where: "app" },
  { key: "me.notNow", en: "not now — I will fill it in later", fr: "pas maintenant — je remplirai plus tard", where: "app" },
  { key: "me.pictureDidNotGoUp", en: "That picture did not go up.", fr: "Cette image n’a pas pu être envoyée.", where: "app" },
  { key: "me.didNotSave", en: "That did not save.", fr: "L’enregistrement a échoué.", where: "app" },
  { key: "me.onCommunity", en: "On the community page, where anybody here can find you.", fr: "Sur la page communauté, où n’importe qui ici peut vous trouver.", where: "app" },
  { key: "me.notOnCommunity", en: "Not on the community page — only the people cooking see this.", fr: "Pas sur la page communauté — seules les personnes qui cuisinent voient ceci.", where: "app" },

  /* -------------------------------------------- the app: the four shortcuts */
  { key: "cut.whatsOn", en: "what’s on", fr: "à l’affiche", where: "app" },
  { key: "cut.tellSomebody", en: "tell somebody", fr: "en parler", where: "app" },
  { key: "cut.yourDetails", en: "your details", fr: "vos informations", where: "app" },
  { key: "cut.getInTouch", en: "get in touch", fr: "nous écrire", where: "app" },
  { key: "cut.inviteText", en: "Come and cook with us. Everyone is a member.", fr: "Venez cuisiner avec nous. Tout le monde est membre.", where: "app", note: "What the phone’s share sheet offers to send." },
  { key: "cut.openingEmail", en: "Opening an email — this browser has nothing to share with.", fr: "Ouverture d’un e-mail — ce navigateur n’a rien pour partager.", where: "app" },

  /* --------------------------------------------- the app: your own things */
  { key: "mine.photographs", en: "your photographs", fr: "vos photographies", where: "app" },
  { key: "mine.noPhotographs", en: "None yet. The archive says who took what, and anything credited to you turns up here.", fr: "Aucune pour l’instant. L’archive indique qui a pris quoi, et tout ce qui vous est crédité apparaît ici.", where: "app" },
  { key: "mine.whatYouSaid", en: "what you have said", fr: "ce que vous avez dit", where: "app" },
  { key: "mine.nothingYet", en: "Nothing yet.", fr: "Rien pour l’instant.", where: "app" },
  { key: "mine.saySomething", en: "Say something", fr: "Dites quelque chose", where: "app", note: "A link, straight after “Nothing yet.”" },

  /* ------------------------------------------------ the app: saying something to us */
  { key: "tell.aWord", en: "a word", fr: "un mot", where: "app" },
  { key: "tell.aWordHint", en: "Anything at all — a question, a hello, a complaint.", fr: "N’importe quoi — une question, un bonjour, une plainte.", where: "app" },
  { key: "tell.aBug", en: "a bug", fr: "un bug", where: "app" },
  { key: "tell.aBugHint", en: "Something in here is broken. Say which screen and what you did.", fr: "Quelque chose ne marche pas. Dites quel écran et ce que vous avez fait.", where: "app" },
  { key: "tell.anIdea", en: "an idea", fr: "une idée", where: "app" },
  { key: "tell.anIdeaHint", en: "Something this could do that it does not.", fr: "Quelque chose que ceci pourrait faire et ne fait pas.", where: "app" },
  { key: "tell.alsoSent", en: "Which screen you were on and which browser you are using are sent along with it.", fr: "L’écran où vous étiez et le navigateur que vous utilisez sont envoyés avec.", where: "app", note: "Added to the line above the field, for a bug only. Starts with a space in English." },
  { key: "tell.bugEg", en: "I pressed… and instead of… it…", fr: "J’ai appuyé sur… et au lieu de… ça…", where: "app", note: "The grey text in the empty field." },
  { key: "tell.ideaEg", en: "It would be good if…", fr: "Ce serait bien si…", where: "app" },
  { key: "tell.whatToSay", en: "What you want to say", fr: "Ce que vous voulez dire", where: "app", note: "Read out by a screen reader; not shown." },
  { key: "tell.sending", en: "sending…", fr: "envoi…", where: "app" },
  { key: "tell.sendIt", en: "send it", fr: "envoyer", where: "app" },
  { key: "tell.didNotSend", en: "That did not send.", fr: "L’envoi a échoué.", where: "app" },
  { key: "tell.thanksBug", en: "Thank you — that is written down, with which screen and which browser. We read these.", fr: "Merci — c’est noté, avec l’écran et le navigateur. Nous les lisons.", where: "app" },
  { key: "tell.thanks", en: "Thank you — that is with us. We read these, and you will hear back if it needs an answer.", fr: "Merci — c’est bien arrivé. Nous les lisons, et vous aurez une réponse si elle s’impose.", where: "app" },
  { key: "tell.orFindUs", en: "or find us", fr: "ou nous trouver", where: "app" },

  /* ---------------------------------------------- the app: the card beside you */
  { key: "you.addPortrait", en: "add a portrait", fr: "ajouter un portrait", where: "app" },
  { key: "you.noNameYet", en: "no name yet", fr: "pas encore de nom", where: "app" },
  { key: "you.nothingFilledIn", en: "Nothing filled in yet. The rest of it is how anybody here finds out who can weld, who has a van and who speaks Romanian — which is most of how an evening actually gets built.", fr: "Rien de rempli pour l’instant. C’est ainsi qu’on découvre ici qui sait souder, qui a une camionnette et qui parle roumain — c’est l’essentiel de la façon dont une soirée se monte.", where: "app" },

  /* ------------------------------------------------------- the app: leaving */
  { key: "go.leaveTheClub", en: "leave the club", fr: "quitter le club", where: "app" },
  { key: "go.everythingGoes", en: "Everything goes: your name, your portrait, your member number, what you signed up for, and everything you have written here — with the pictures on it. Your way in is deleted too. None of it can be brought back.", fr: "Tout disparaît : votre nom, votre portrait, votre numéro de membre, vos inscriptions et tout ce que vous avez écrit ici — avec les images. Votre accès est supprimé aussi. Rien ne peut être récupéré.", where: "app" },
  { key: "go.reallyDelete", en: "Delete your account and everything on it? This cannot be undone.", fr: "Supprimer votre compte et tout ce qu’il contient ? C’est irréversible.", where: "app", note: "The phone asks this. The second of two asks." },
  { key: "go.deleting", en: "deleting everything…", fr: "suppression…", where: "app" },
  { key: "go.yesDelete", en: "yes, delete everything", fr: "oui, tout supprimer", where: "app" },
  { key: "go.noStay", en: "no, stay", fr: "non, rester", where: "app" },
  { key: "go.didNotFinish", en: "That did not finish. Nothing has been deleted — write to info@promeNOODology.com and we will do it by hand.", fr: "Cela n’a pas abouti. Rien n’a été supprimé — écrivez à info@promeNOODology.com et nous le ferons à la main.", where: "app" },

  /* --------------------------------------------------- the app: handing a sheet on */
  { key: "hand.sendThis", en: "send this to somebody", fr: "envoyer ceci à quelqu’un", where: "app" },
  { key: "hand.copied", en: "Copied. Paste it anywhere.", fr: "Copié. Collez-le où vous voulez.", where: "app" },
  { key: "hand.noAccountNeeded", en: "No account needed at the other end. That is the point of it.", fr: "Aucun compte nécessaire à l’autre bout. C’est tout l’intérêt.", where: "app" },

  /* -------------------------------------------------------- the app: waves */
  { key: "wave.howMany", en: "{n} people waved at you", fr: "{n} personnes vous ont fait signe", where: "app", note: "Read out by a screen reader. Keep {n} exactly as it is." },
  { key: "wave.whoHas", en: "Who has waved at you", fr: "Qui vous a fait signe", where: "app", note: "Read out by a screen reader when nobody has." },

  /* ---------------------------------------------- the app: the rest of the screens */
  { key: "pg.hello", en: "hello", fr: "bonjour", where: "app", note: "The small line above “who waved at you”." },
  { key: "pg.whoWaved", en: "who waved at you", fr: "qui vous a fait signe", where: "app" },
  { key: "pg.nobodyYet", en: "Nobody yet.", fr: "Personne pour l’instant.", where: "app" },
  { key: "pg.haveALookWho", en: "Have a look at who is around", fr: "Voyez qui est là", where: "app", note: "A link, straight after “Nobody yet.”" },
  { key: "pg.waveCostsNothing", en: "— a wave is the whole message, so it costs nothing to send one.", fr: "— un signe est tout le message, cela ne coûte rien d’en envoyer un.", where: "app" },
  { key: "pg.getInTouch", en: "get in touch", fr: "nous écrire", where: "app" },
  { key: "pg.sayAnything", en: "say anything", fr: "dites ce que vous voulez", where: "app" },
  { key: "pg.whoAreYou", en: "who are you, then?", fr: "qui êtes-vous donc ?", where: "app" },
  { key: "pg.everythingJoined", en: "everything you joined", fr: "tout ce que vous avez rejoint", where: "app" },
  { key: "pg.everythingWrote", en: "everything you wrote", fr: "tout ce que vous avez écrit", where: "app" },
  { key: "pg.whatYouTook", en: "what you took", fr: "ce que vous avez photographié", where: "app" },
  { key: "pg.whoYouAreHere", en: "who you are here", fr: "qui vous êtes ici", where: "app" },
  { key: "pg.howYouGetIn", en: "how you get in", fr: "comment vous vous connectez", where: "app" },
  { key: "pg.inWriting", en: "in writing", fr: "les textes officiels", where: "app" },
  { key: "pg.aStory", en: "a story", fr: "un récit", where: "app" },
  { key: "pg.doItYourself", en: "do it yourself", fr: "faites-le vous-même", where: "app" },

  /* -------------------------------------------------- the app: a sheet, in full */
  { key: "dsy.oneSheetPer", en: "One sheet per kind of place, all of them about the same thing: getting people who do not know each other into the same place, and giving them something to do together once they are there. Every sheet lives at an address anybody can open without an account, so you can send it to whoever has the courtyard.", fr: "Une fiche par type de lieu, toutes sur la même chose : réunir des gens qui ne se connaissent pas et leur donner quelque chose à faire ensemble. Chaque fiche a une adresse ouvrable sans compte, pour l’envoyer à qui a la cour.", where: "app" },
  { key: "dsy.beingWritten", en: "The first sheets are being written. The handbook under", fr: "Les premières fiches sont en cours d’écriture. Le manuel sous", where: "app", note: "Followed by a link reading “read”, then the line below." },
  { key: "dsy.readLink", en: "read", fr: "lire", where: "app", note: "The link in the middle of that sentence — the name of the tab." },
  { key: "dsy.longVersion", en: "is the long version in the meantime.", fr: "en est la version longue en attendant.", where: "app" },
  { key: "dsy.whatItTakes", en: "what it takes", fr: "ce qu’il faut", where: "app" },
  { key: "dsy.borrowed", en: "Borrowed beats bought, and none of it has to match. Half of it is not cooking equipment — the chalk, the game, the one light and the spare seat are what turn a place into an evening.", fr: "Emprunté vaut mieux qu’acheté, et rien n’a besoin d’être assorti. La moitié n’est pas du matériel de cuisine — la craie, le jeu, la lampe et la chaise en plus font d’un lieu une soirée.", where: "app" },
  { key: "dsy.whatToDo", en: "what to do", fr: "quoi faire", where: "app" },
  { key: "dsy.handItOn", en: "hand it on", fr: "faites-la circuler", where: "app" },
  { key: "dsy.aboutHowMany", en: "About {n} people stayed for that one. Somebody you know has a place like it and has not thought of it.", fr: "Environ {n} personnes sont restées cette fois-là. Quelqu’un que vous connaissez a un lieu comme celui-ci sans y avoir pensé.", where: "app", note: "Keep {n} exactly as it is." },
  { key: "dsy.somebodyKnows", en: "Somebody you know has a place like this and has not thought of it.", fr: "Quelqu’un que vous connaissez a un lieu comme celui-ci sans y avoir pensé.", where: "app" },

  /* ------------------------------------------------------- the app: the map */
  { key: "map.wouldNotDraw", en: "The map would not draw here. The places are all still listed.", fr: "La carte n’a pas pu s’afficher ici. Les lieux restent tous listés.", where: "app" },
  { key: "map.needsALine", en: "The map needs a line to the outside. The list works without one.", fr: "La carte a besoin d’une connexion. La liste fonctionne sans.", where: "app" },
  { key: "map.wouldNotOpen", en: "The map would not open: {why}", fr: "La carte n’a pas pu s’ouvrir : {why}", where: "app", note: "{why} is the machine’s own words, in English. Keep {why} exactly as it is." },
  { key: "map.unknown", en: "unknown", fr: "cause inconnue", where: "app", note: "When even the machine did not say why." },
  { key: "map.close", en: "Close", fr: "Fermer", where: "app", note: "Read out for the cross on the card; not shown." },
  { key: "map.ate", en: "ate", fr: "repas servis", where: "app", note: "After a number: “120 ate”." },
  { key: "map.readIt", en: "read it", fr: "le lire", where: "app" },
  { key: "map.stillToCome", en: "it is still to come", fr: "c’est encore à venir", where: "app" },
  { key: "map.places", en: "places", fr: "lieux", where: "app", note: "After a number: “14 places”." },
  { key: "map.howManyAhead", en: "{n} still to come", fr: "{n} encore à venir", where: "app", note: "Keep {n} exactly as it is." },
  { key: "map.fiveYears", en: "five years of them", fr: "cinq années de cela", where: "app" },
  { key: "map.toCome", en: "to come", fr: "à venir", where: "app", note: "A small mark beside an evening that has not happened." },

  /* -------------------------------------------- the app: how you sign in */
  { key: "in.howYouSignIn", en: "how you sign in", fr: "comment vous vous connectez", where: "app" },
  { key: "in.aCodeTo", en: "A code to", fr: "Un code à", where: "app", note: "Followed by their address in bold, then the line below." },
  { key: "in.noPassword", en: ". No password, so there is nothing to forget.", fr: ". Pas de mot de passe, donc rien à oublier.", where: "app", note: "Starts with the full stop that closes the sentence above." },
  { key: "in.newAddress", en: "your new address", fr: "votre nouvelle adresse", where: "app" },
  { key: "in.newAddressEg", en: "you@somewhere-else.com", fr: "vous@ailleurs.com", where: "app" },
  { key: "in.sending", en: "sending…", fr: "envoi…", where: "app" },
  { key: "in.sendTheLink", en: "send the link", fr: "envoyer le lien", where: "app" },
  { key: "in.neverMind", en: "never mind", fr: "laisser tomber", where: "app" },
  { key: "in.nothingMoves", en: "Nothing moves until you open the link in the new inbox. Until then this address still works.", fr: "Rien ne change tant que vous n’ouvrez pas le lien dans la nouvelle boîte. En attendant, cette adresse fonctionne toujours.", where: "app" },
  { key: "in.differentAddress", en: "use a different address", fr: "changer d’adresse", where: "app" },
  { key: "in.appleHeading", en: "Sign in with Apple", fr: "Se connecter avec Apple", where: "app", note: "Apple’s own wording. Use whatever Apple uses in French." },
  { key: "in.reading", en: "reading…", fr: "lecture…", where: "app" },
  { key: "in.joinedToAccount", en: "Joined to this account. The button on the Apple sign-in screen brings you straight back here.", fr: "Rattaché à ce compte. Le bouton sur l’écran Apple vous ramène directement ici.", where: "app" },
  { key: "in.onlyWayIn", en: "It is the only way into this account at the moment", fr: "C’est actuellement le seul accès à ce compte", where: "app", note: "The hover on a button that cannot be pressed." },
  { key: "in.onlyWayInLong", en: "It is the only way into this account at the moment, so it cannot be taken off yet.", fr: "C’est actuellement le seul accès à ce compte : impossible de le retirer pour l’instant.", where: "app" },
  { key: "in.disconnectIt", en: "disconnect it", fr: "le détacher", where: "app" },
  { key: "in.joinItOn", en: "Join it to this account and you can sign in with a face rather than a code. Your account stays the same one — this is added to it, not instead of it, so choosing “hide my email” on the Apple screen changes nothing here.", fr: "Rattachez-le à ce compte et connectez-vous avec un visage plutôt qu’un code. Votre compte reste le même — ceci s’y ajoute, ne le remplace pas ; choisir « masquer mon e-mail » sur l’écran Apple n’y change rien.", where: "app" },
  { key: "in.couldNotRead", en: "Could not read how this account signs in.", fr: "Impossible de lire comment ce compte se connecte.", where: "app" },
  { key: "in.linkingOff", en: "Joining accounts is switched off in Supabase — turn on manual linking and this will work.", fr: "La liaison des comptes est désactivée dans Supabase — activez la liaison manuelle et cela fonctionnera.", where: "app", note: "Only whoever looks after the site ever sees this." },

  { key: "tell.whatKind", en: "What kind of thing", fr: "De quel genre", where: "app", note: "Read out by a screen reader over “a word / a bug / an idea”; not shown." },

  { key: "wait.coming", en: "Coming…", fr: "Chargement…", where: "app", note: "Read out by a screen reader while a screen is still arriving; not shown." },
  { key: "card.memberSince", en: "member since {when}", fr: "membre depuis le {when}", where: "app", note: "On the membership card. Keep {when} exactly as it is." },
  { key: "card.no", en: "no", fr: "n°", where: "app", note: "Before the member number on the card, as in “no 0003”." },

  { key: "legal.lastChanged", en: "Last changed {when}. Anything wrong or missing:", fr: "Dernière modification le {when}. Une erreur ou un oubli :", where: "app", note: "Followed by an email address. Keep {when} exactly as it is." },

  { key: "me.day", en: "day", fr: "jour", where: "app", note: "The first of the three birthday fields." },
  { key: "me.month", en: "month", fr: "mois", where: "app" },
  { key: "me.year", en: "year", fr: "année", where: "app" },
  { key: "me.notSaid", en: "—", fr: "—", where: "app", note: "The empty choice in a dropdown. An em dash; it means nothing has been chosen." },
  {
    key: "me.yearIsYours",
    en: "The year is yours to leave out, and most people should: we only want to know it is your birthday. A full date of birth is the single most useful thing to somebody pretending to be you.",
    fr: "L’année, vous pouvez la laisser vide, et c’est ce que nous conseillons : nous voulons seulement savoir que c’est votre anniversaire. Une date de naissance complète est ce qu’il y a de plus utile à qui voudrait se faire passer pour vous.",
    where: "app",
  },

  { key: "card.turnOver", en: "Turn the card over", fr: "Retourner la carte", where: "app", note: "Read out for the card itself; not shown." },
  { key: "card.theBack", en: "the back", fr: "le dos", where: "app", note: "On the reverse of the membership card." },
  { key: "card.whatItIs", en: "This card is not a ticket and it is not proof of anything. It says somebody knows you.", fr: "Cette carte n’est ni un billet ni une preuve de quoi que ce soit. Elle dit que quelqu’un vous connaît.", where: "app" },
  { key: "card.notNumbered", en: "not numbered yet", fr: "pas encore de numéro", where: "app" },
  { key: "card.noName", en: "no name yet", fr: "pas encore de nom", where: "app" },

  /* ------------------------------------- the back of the house, from a phone */
  { key: "row.partOf", en: "part of", fr: "fait partie de", where: "app", note: "Followed by the name of the event a single day belongs to." },
  { key: "who.everybody", en: "everybody in the club", fr: "tout le monde dans le club", where: "app", note: "The admin-only screen in Account: the list of people." },
  { key: "who.onlyAdmins", en: "only you and the other admins see this", fr: "vous et les autres administrateurs seulement", where: "app" },
  { key: "who.find", en: "find somebody", fr: "chercher quelqu’un", where: "app", note: "The search field above the list." },
  { key: "who.howMany", en: "{n} people", fr: "{n} personnes", where: "app" },
  { key: "who.nobody", en: "Nobody by that name.", fr: "Personne de ce nom.", where: "app" },
  { key: "who.admin", en: "admin", fr: "admin", where: "app", note: "A small mark on the row of somebody who can get into the back of the house." },
  { key: "who.notListed", en: "not on the community page", fr: "pas sur la page communauté", where: "app" },
  { key: "who.noWayIn", en: "no way in yet", fr: "pas encore d’accès", where: "app", note: "Somebody written down who has never been sent an invitation." },
  { key: "who.writeSomebodyDown", en: "write somebody down", fr: "inscrire quelqu’un", where: "app", note: "Adds a person to the community page without asking them to sign in." },
  { key: "who.theirName", en: "their name", fr: "leur nom", where: "app" },
  { key: "who.theirCountry", en: "the country", fr: "le pays", where: "app" },
  { key: "who.add", en: "Write them down", fr: "Les inscrire", where: "app" },
  { key: "who.editing", en: "who they are", fr: "qui c’est", where: "app", note: "The title of the pop-up for one person." },
  { key: "who.theirCity", en: "the town or city", fr: "la ville", where: "app" },
  { key: "who.whatTheyDo", en: "what they do", fr: "ce qu’ils font", where: "app" },
  { key: "who.onThePage", en: "on the community page", fr: "sur la page communauté", where: "app" },
  { key: "who.canGetIn", en: "can get into the back of the house", fr: "peut accéder à l’administration", where: "app" },
  { key: "who.save", en: "Save", fr: "Enregistrer", where: "app" },
  { key: "who.saving", en: "Saving…", fr: "Enregistrement…", where: "app" },
  { key: "who.saved", en: "Saved.", fr: "Enregistré.", where: "app" },
  { key: "who.sendAWayIn", en: "send them a way in", fr: "leur envoyer un accès", where: "app", note: "Emails somebody a sign-in link." },
  { key: "who.theirEmail", en: "their email address", fr: "leur adresse e-mail", where: "app" },
  { key: "who.send", en: "Send it", fr: "Envoyer", where: "app" },
  { key: "who.sending", en: "Sending…", fr: "Envoi…", where: "app" },
  { key: "who.sent", en: "Sent. They have a way in.", fr: "Envoyé. Ils ont un accès.", where: "app" },
  { key: "who.somethingWrong", en: "That did not go through.", fr: "Cela n’a pas fonctionné.", where: "app" },

  /* -------------------------------------------- the website: your own profile */
  { key: "you.theTown", en: "the town or city you are in", fr: "la ville où vous êtes", where: "front", note: "On your profile. Deliberately not “where you are”, which people answer with a country." },
  { key: "you.theCountry", en: "the country", fr: "le pays", where: "front" },
  { key: "you.optional", en: "optional", fr: "facultatif", where: "front", note: "The grey text in a field nobody has to fill in." },

  { key: "you.yourName", en: "your name", fr: "votre nom", where: "front" },
  { key: "you.showMe", en: "show me on the community page", fr: "m’afficher sur la page communauté", where: "front" },
  { key: "you.saving", en: "saving…", fr: "enregistrement…", where: "front" },
  { key: "you.save", en: "save →", fr: "enregistrer →", where: "front" },

  /* --------------------------------------------------------- the back of the house

     Nothing yet, and the section is drawn anyway — see WHERES. The words in
     here are read by whoever is looking after the site and by nobody else, so
     translating them is the last thing worth doing rather than the first. The
     two names of the languages are deliberately not in here: a language names
     itself, and "English" in French is English. */
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
      "The words in here — read by whoever is looking after the site and by nobody else, which is why translating them is the last thing worth doing rather than the first.",
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

/**
 * Every phrase of one half of the house, resolved, as plain data.
 *
 * `speaking` above is a function, which a server component can call and a client
 * component cannot be handed. The app is mostly client components — a tab bar, a
 * sheet that slides up, a form that answers as you type — and threading a dozen
 * strings into each one as props was the reason its own words stayed in English
 * long after the website's were translated.
 *
 * So: the layout resolves the app's phrases once, on the server, where the
 * language is known, and hands the result down as an ordinary object. About
 * three kilobytes of text for the whole app, sent once per screen rather than
 * per component.
 */
export function saying(
  lang: "en" | "fr",
  said: Record<string, string> = {},
  where: Where,
): Record<string, string> {
  const say = speaking(lang, said);
  const out: Record<string, string> = {};
  for (const phrase of PHRASES) if (phrase.where === where) out[phrase.key] = say(phrase.key);
  return out;
}
