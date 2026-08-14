import Image from "next/image";
import Link from "next/link";

type Props = {
  /** Small line above the title, e.g. "welcome". */
  eyebrow?: string;
  title: string;
  /** Shown on the right: usually a link back to the website. */
  aside?: React.ReactNode;
};

export default function AppHeader({ eyebrow, title, aside }: Props) {
  return (
    <header className="app-header">
      <Link href="/app" className="app-mark" aria-label="promeNOODology">
        <Image src="/logo-mark.png" alt="" width={600} height={582} priority sizes="34px" />
      </Link>
      <div className="app-header-text">
        {eyebrow ? <p className="app-eyebrow">{eyebrow}</p> : null}
        <h1 className="app-title">{title}</h1>
      </div>
      {aside ? <div className="app-header-aside">{aside}</div> : null}
    </header>
  );
}
