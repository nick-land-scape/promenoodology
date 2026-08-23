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
  { key: "event.takeAsPdf", en: "take it as a PDF ↓", fr: "télécharger le PDF ↓", where: "front" },
  { key: "event.lookThrough", en: "look through the flyer", fr: "feuilleter le flyer", where: "front", note: "Opens the flyer as a book." },
  { key: "event.inTheApp", en: "In the members’ app —", fr: "Dans l’app des membres —", where: "front" },
  { key: "event.places", en: "places", fr: "places", where: "front", note: "As in “, 20 places”." },
  { key: "event.whatsOn", en: "what’s on", fr: "ce qui se passe", where: "front", note: "The link into the members’ app." },

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
  { key: "acc.imprint", en: "imprint", fr: "mentions légales", where: "app" },
  { key: "acc.signOut", en: "sign out", fr: "se déconnecter", where: "app" },

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
