/**
 * What a screen looks like while it is on its way.
 *
 * Without this, moving between tabs on a slow line shows the *old* screen until
 * the new one arrives — so a tap looks like it did nothing, and people tap again.
 * With it, the tap paints something immediately: the shape of the screen that is
 * coming, in the same rules and boxes, so the arrival is a fill rather than a
 * jump.
 *
 * One file covers every screen in the app: they are all a header and a list, and
 * a skeleton that is honest about being a skeleton beats five that pretend to
 * know what is coming.
 */
export default function Loading() {
  return (
    <div className="waiting" aria-busy="true" aria-live="polite">
      <div className="waiting-head">
        <span className="waiting-block" style={{ width: 34, height: 34, borderRadius: 999 }} />
        <span>
          <span className="waiting-block" style={{ width: 60, height: 8 }} />
          <span className="waiting-block" style={{ width: 180, height: 20, marginTop: 8 }} />
        </span>
      </div>

      {[0, 1, 2, 3].map((row) => (
        <div className="waiting-row" key={row}>
          <span className="waiting-block" style={{ width: 44, height: 44 }} />
          <span style={{ flex: 1 }}>
            <span className="waiting-block" style={{ width: "62%", height: 14 }} />
            <span className="waiting-block" style={{ width: "38%", height: 10, marginTop: 7 }} />
          </span>
        </div>
      ))}

      <span className="visually-hidden">Coming…</span>
    </div>
  );
}
