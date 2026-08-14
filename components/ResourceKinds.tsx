import Link from "next/link";

const KINDS = [
  { href: "/resources", label: "photos" },
  { href: "/resources/quotes", label: "quotes" },
];

/** Switches the archive between the kinds of thing we keep. */
export default function ResourceKinds({ current }: { current: string }) {
  return (
    <div className="filter-group">
      <span className="filter-label">in the archive</span>
      {KINDS.map((kind) => (
        <Link
          key={kind.href}
          href={kind.href}
          className="filter-kind"
          aria-current={kind.href === current ? "page" : undefined}
        >
          {kind.label}
        </Link>
      ))}
    </div>
  );
}
