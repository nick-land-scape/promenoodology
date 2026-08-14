import fs from "node:fs";
import path from "node:path";

/**
 * The handbook is one text file: a few `key: value` lines, a blank line, and
 * then blocks. A block that starts with ## is a heading, everything else is a
 * paragraph. Nothing more clever than that, so anybody can edit it.
 */

export type Handbook = {
  title: string;
  lead: string;
  blocks: { kind: "heading" | "text"; text: string }[];
};

export function getHandbook(): Handbook {
  const raw = fs
    .readFileSync(path.join(process.cwd(), "content", "handbook.md"), "utf8")
    .replace(/^﻿/, "");

  const lines = raw.split(/\r?\n/);
  const fields: Record<string, string> = {};
  let cursor = 0;
  for (; cursor < lines.length; cursor++) {
    const line = lines[cursor].trim();
    if (line === "") break;
    const separator = line.indexOf(":");
    if (separator === -1) break;
    fields[line.slice(0, separator).trim().toLowerCase()] = line.slice(separator + 1).trim();
  }

  const blocks = lines
    .slice(cursor)
    .join("\n")
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .map((block) =>
      block.startsWith("##")
        ? { kind: "heading" as const, text: block.replace(/^#+\s*/, "") }
        : { kind: "text" as const, text: block },
    );

  return {
    title: fields.title ?? "the handbook",
    lead: fields.lead ?? "",
    blocks,
  };
}
