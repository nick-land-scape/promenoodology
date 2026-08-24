import Link from "next/link";
import { notFound } from "next/navigation";
import CalendarPick from "@/components/CalendarPick";
import AppHeader from "@/components/app/AppHeader";
import Evening from "@/components/app/Evening";
import Linked from "@/components/Linked";
import Photo from "@/components/Photo";
import { dateParts, whenItIs } from "@/lib/app-data";
import { calendarRows } from "@/lib/calendar";
import { myBookings, readingIn, requireMember, whoIsBringingWhat } from "@/lib/app/me";
import { pretty } from "@/lib/admin/when";
import { getEvent, getEvents, getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

/* What you have asked for is on it, so it is worked out per request rather than
   cached for a minute. */
export const dynamic = "force-dynamic";

/**
 * One evening, in the app, in full.
 *
 * The list is a list: a name, a day, and a way of saying you are coming. It is
 * the right screen for choosing between six evenings and the wrong one for
 * reading about a summer of Saturdays, which is what an evening with a programme
 * and a page now is. So the row opens.
 *
 * The same evening has a page on the website. This one differs in the two ways a
 * members' screen should: it says who is bringing what, and it is where you
 * actually say you are coming.
 */
export default async function EveningPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMember("/app/events");
  const lang = await readingIn();
  const say = speaking(lang, await getFrench());
  const { id } = await params;

  /* By slug or by id, because both are addresses somebody may have been given:
     the website's link carries the slug, and the app's own list carries the id. */
  const all = await getEvents(lang);
  const found = all.find((one) => one.id === id || one.slug === id);
  if (!found) notFound();

  const [event, mine, bringing] = await Promise.all([
    getEvent(found.slug, lang),
    myBookings(),
    whoIsBringingWhat(found.id),
  ]);
  if (!event) notFound();

  const booking = mine.find((one) => one.eventId === event.id);
  const over = (event.until || event.date) < new Date().toISOString().slice(0, 10);

  /* The calendar picker, built here because working out the days needs the database
     and the reader's language. Handed to the header, which is where the three
     controls live now. */
  const calendar =
    event.slug && event.date ? (
      <CalendarPick
        className="pill pill-small"
        rows={calendarRows(event, {
          whole: say("eve.theWhole"),
          when: (iso, time) => {
            const when = dateParts(iso, lang);
            return [`${when.day} ${when.month}`, time].filter(Boolean).join(", ");
          },
        })}
        words={{
          open: say("eve.addToCalendar"),
          which: say("eve.whichDay"),
          back: say("eve.back"),
          file: say("eve.theFile"),
          google: say("cal.google"),
          outlook: say("cal.outlook"),
          said: say("eve.whichIsWhich"),
        }}
      />
    ) : null;

  return (
    <>
      <AppHeader
        eyebrow={say("on.eyebrow")}
        title={event.title}
        back="/app/events"
        /* No hand up here: this screen's right-hand side is the three things you can
           do about this evening, and a fourth thing to press among them is a thumb
           landing on the wrong one. */
        wave={false}
        aside={
          over ? null : (
            <Evening
              eventId={event.id}
              spots={event.spots}
              mine={
                booking && booking.state !== "interested"
                  ? { people: booking.people, bringing: booking.bringing, state: booking.state }
                  : null
              }
              interested={booking?.state === "interested"}
              tight
            >
              {calendar}
            </Evening>
          )
        }
      />

      <div className="evening">
        {event.photo ? (
          <figure className="evening-photo">
            <Photo
              src={event.photo.src}
              alt=""
              width={event.photo.width}
              height={event.photo.height}
              sizes="(max-width: 767px) 100vw, 640px"
              priority
            />
          </figure>
        ) : null}

        {event.subtitle ? <p className="evening-hook">{event.subtitle}</p> : null}
        <p className="evening-when">{whenItIs(event, lang)}</p>
        {event.address ? <p className="evening-where">{event.address}</p> : null}
        {event.lead ? (
          <p className="evening-lead">
            <Linked>{event.lead}</Linked>
          </p>
        ) : null}

        {/* The things you can do about this evening are in the header now, where they
            are still on the screen at the foot of a long page. What stays here is
            the one sentence for an evening that has already happened. */}
        {over ? <p className="app-note">{say("eve.itHasBeen")}</p> : null}

        {event.days.length > 0 ? (
          <section className="evening-days">
            <h2 className="evening-label">{say("eve.programme")}</h2>
            <ol>
              {event.days.map((day) => (
                <li key={`${day.date}-${day.title}`}>
                  <p className="evening-day-when">
                    {[pretty(day.date), [day.time, day.endTime].filter(Boolean).join("–")]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {day.title ? <h3 className="evening-day-name">{day.title}</h3> : null}
                  {day.what ? (
                    <p className="evening-text">
                      <Linked>{day.what}</Linked>
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* Whatever was written at length. Photographs on this screen are one
            column wide, so the blocks are read for their words and their
            pictures and not for the arrangement, which is a page's business. */}
        {event.blocks.length > 0 ? (
          <section className="evening-page">
            {event.blocks.map((block, index) =>
              block.kind === "heading" ? (
                <h2 key={index} className="evening-label">
                  {block.words}
                </h2>
              ) : block.kind === "text" ? (
                <p key={index} className="evening-text">
                  <Linked>{block.words}</Linked>
                </p>
              ) : block.kind === "photo" ? (
                <figure key={index} className="evening-photo">
                  <Photo
                    src={block.photo.src}
                    alt=""
                    width={block.photo.width}
                    height={block.photo.height}
                    sizes="(max-width: 767px) 100vw, 640px"
                  />
                  {block.caption ? <figcaption>{block.caption}</figcaption> : null}
                </figure>
              ) : (
                <span key={index} className="evening-gap" aria-hidden="true" />
              ),
            )}
          </section>
        ) : null}

        {/* The two most useful sentences about an improvised kitchen. */}
        {!over && event.needs.trim() ? (
          <section className="evening-block">
            <h2 className="evening-label">{say("eve.stillWanted")}</h2>
            <ul className="evening-list">
              {event.needs
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => (
                  <li key={line}>{line}</li>
                ))}
            </ul>
          </section>
        ) : null}

        {bringing.length > 0 ? (
          <section className="evening-block">
            <h2 className="evening-label">{say("eve.comingWith")}</h2>
            <ul className="evening-list">
              {bringing.map((one) => (
                <li key={`${one.who}-${one.what}`}>
                  {one.what} <i>{one.who.split(" ")[0]}</i>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="evening-block">
          <h2 className="evening-label">{say("eve.practicalBits")}</h2>
          <ul className="evening-list">
            {event.place ? <li>{event.place}</li> : null}
            {event.cost ? <li>{event.cost}</li> : null}
            {event.note ? <li>{event.note}</li> : null}
            {event.signUpEmail ? (
              <li>
                {say("eve.orWriteTo")}{" "}
                <a href={`mailto:${event.signUpEmail}`}>{event.signUpEmail}</a>
              </li>
            ) : null}
            {event.partners.length > 0 ? (
              <li>
                {say("eve.with")} {event.partners.map((one) => one.name).join(", ")}
              </li>
            ) : null}
            {event.partOf ? (
              <li>
                {say("eve.partOf")} {event.partOf}
              </li>
            ) : null}
            {event.fed ? (
              <li>
                {event.fed} {say("eve.ate")}
              </li>
            ) : null}
          </ul>
        </section>

        {event.story ? (
          <p className="evening-block">
            <Link className="pill" href={`/app/read/${event.story.slug}`}>
              {say("eve.readWhatCame")}
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}
