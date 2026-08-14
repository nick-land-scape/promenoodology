"use client";

import { useState } from "react";

type Props = {
  title: string;
  year: string | null;
  url: string;
};

/**
 * Anybody is welcome to quote a story, so the reference is written out for them,
 * with the date they looked at it filled in when they copy it.
 */
export default function Cite({ title, year, url }: Props) {
  const [copied, setCopied] = useState(false);

  const reference = (accessed: string) =>
    `promeNOODology, “${title}”${year ? `, ${year}` : ""}. ${url} (accessed ${accessed}).`;

  const shown = reference(year ? "…" : "…").replace("accessed …", "accessed <date>");

  const copy = async () => {
    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    try {
      await navigator.clipboard.writeText(reference(today));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside className="cite">
      <p className="cite-label">cite this story</p>
      <p className="cite-text">{shown}</p>
      <button type="button" className="text-button" onClick={copy}>
        {copied ? "copied, with today’s date" : "copy the reference"}
      </button>
    </aside>
  );
}
