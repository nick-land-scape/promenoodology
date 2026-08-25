/**
 * The shape of a screen while it is on its way.
 *
 * One shared kit, five different shapes — because a skeleton that does not match
 * what arrives is worse than none: the eye learns a layout from it and then has to
 * unlearn it a second later. Each screen's loading file composes its own, out of
 * these, at the sizes that screen actually uses.
 *
 * Nothing here says "loading". It says "a header, then rows with a date and a
 * thumbnail" — and then that is what arrives.
 *
 * Which is also why every bone has square corners: this app's buttons, chips,
 * covers and thumbnails do. A bone used to be drawn as a pill because the things
 * it stood for were pills, and when they were squared it kept its old shape and
 * gave the loading screen away as a separate drawing. The one exception is a face.
 */

export function Bone({
  w,
  h,
  face,
  gap,
}: {
  w: number | string;
  h: number;
  /** A portrait, which is the one thing in this app that is still a circle. */
  face?: boolean;
  gap?: number;
}) {
  return (
    <span
      className="waiting-block"
      style={{
        width: typeof w === "number" ? `${w}px` : w,
        height: h,
        borderRadius: face ? 999 : 0,
        marginTop: gap,
      }}
    />
  );
}

/* There was a BoneHead here: a mark, a line and a title, in grey.
 *
 * It is gone because it was answering a question nobody had. Every header in this
 * app is known before the data is: "what's on / what would you like to join?" is
 * the same sentence whatever the server says. So the waiting states draw the real
 * header and keep bones for the one thing that is genuinely unknown — which is
 * also why nothing jumps when the answer arrives: the header was never replaced,
 * it was there from the first frame.
 *
 * The tab bar never needed one either, and never had one: it lives in the layout,
 * and a loading file only ever replaces the screen inside it.
 */

/** A heading with a count beside it, as every section has. */
export function BoneHeading({ wide = 150 }: { wide?: number }) {
  return (
    <div className="waiting-heading">
      <Bone w={wide} h={19} />
      <Bone w={34} h={9} />
    </div>
  );
}

/** A row: an optional date column, words, an optional thumbnail. */
export function BoneRow({
  date,
  thumb,
  lines = 2,
  button,
}: {
  date?: boolean;
  thumb?: boolean;
  lines?: number;
  button?: boolean;
}) {
  return (
    <div className="waiting-row">
      {date ? (
        <span className="waiting-date">
          <Bone w={26} h={24} />
          <Bone w={22} h={8} gap={5} />
        </span>
      ) : null}
      <span style={{ flex: 1, minWidth: 0 }}>
        <Bone w="72%" h={15} />
        {lines > 1 ? <Bone w="52%" h={10} gap={8} /> : null}
        {lines > 2 ? <Bone w="38%" h={10} gap={6} /> : null}
      </span>
      {button ? <Bone w={78} h={30} /> : null}
      {thumb ? <Bone w={58} h={58} /> : null}
    </div>
  );
}

/** The strip of buttons a screen with two or three views has. */
export function BoneSwitcher() {
  return (
    <div className="waiting-switcher">
      <Bone w="33%" h={40} />
      <Bone w="33%" h={40} />
      <Bone w="33%" h={40} />
    </div>
  );
}

/** The two words under it: how the stories are drawn, list or map. */
export function BoneSmallSwitcher() {
  return (
    <div className="waiting-switcher waiting-switcher-small">
      <Bone w={54} h={10} />
      <Bone w={62} h={10} />
    </div>
  );
}

/**
 * An evening, which is not shaped like a row of words.
 *
 * A square with the date stamped on it down the left, the words beside it, and
 * the bookmark at the top right. It was drawn for a while as words, a wide button
 * and a thumbnail on the right — which was the row as it stood in July: the
 * button was "count me in", and it went from the list the day the list stopped
 * asking for a decision it could not honour. A bone left standing for a control
 * that no longer exists is the worst kind, because the eye believes it.
 */
export function BoneEvening({ lines = 2 }: { lines?: number }) {
  return (
    <div className="waiting-row">
      <span className="waiting-tile">
        <Bone w={72} h={72} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <Bone w="74%" h={15} />
        <Bone w="46%" h={10} gap={8} />
        {lines > 2 ? <Bone w="62%" h={10} gap={6} /> : null}
      </span>
      {/* The bookmark: top right, level with the name, the one control a row has. */}
      <span className="waiting-mark">
        <Bone w={22} h={26} />
      </span>
    </div>
  );
}

/**
 * The line you press to write something, at the foot of the screen.
 *
 * Shut, which is how it always arrives: a face and one line of nothing. It is at
 * the bottom because the feed's composer is — it was over the feed until somebody
 * pointed out that this puts a question before the answers — and the skeleton has
 * to stand where the thing stands or the whole screen appears to jump when it
 * lands.
 */
export function BoneCompose() {
  return (
    <div className="waiting-compose">
      <Bone w={40} h={40} face />
      <span style={{ flex: 1, minWidth: 0 }}>
        <Bone w="100%" h={38} />
      </span>
    </div>
  );
}

/** The figures at the foot of the front screen: a number and its name, three times. */
export function BoneTally() {
  return (
    <div className="waiting-tally">
      {[0, 1, 2].map((one) => (
        <span key={one}>
          <Bone w={56} h={30} />
          <Bone w={72} h={9} gap={7} />
        </span>
      ))}
    </div>
  );
}
