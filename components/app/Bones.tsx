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
 */

export function Bone({
  w,
  h,
  round,
  gap,
}: {
  w: number | string;
  h: number;
  round?: boolean;
  gap?: number;
}) {
  return (
    <span
      className="waiting-block"
      style={{
        width: typeof w === "number" ? `${w}px` : w,
        height: h,
        borderRadius: round ? 999 : 3,
        marginTop: gap,
      }}
    />
  );
}

/** The header every screen has: a mark, a small line, a title. */
export function BoneHead() {
  return (
    <div className="waiting-head">
      <Bone w={34} h={34} round />
      <span>
        <Bone w={58} h={8} />
        <Bone w={176} h={22} gap={9} />
      </span>
      <Bone w={22} h={22} round />
    </div>
  );
}

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
      {button ? <Bone w={78} h={30} round /> : null}
      {thumb ? <Bone w={58} h={58} /> : null}
    </div>
  );
}

/** The strip of round buttons a screen with two or three views has. */
export function BoneSwitcher() {
  return (
    <div className="waiting-switcher">
      <Bone w="33%" h={40} round />
      <Bone w="33%" h={40} round />
      <Bone w="33%" h={40} round />
    </div>
  );
}
