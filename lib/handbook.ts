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
    .filter((block) => block.trim().length > 0)
    .flatMap((raw) => {
      // A heading takes its own line; anything after it in the same block is
      // the paragraph that belongs to it.
      const block = raw.trim();
      if (!block.startsWith("##")) {
        return [{ kind: "text" as const, text: block.replace(/\s*\n\s*/g, " ") }];
      }
      const newline = block.indexOf("\n");
      const heading = (newline === -1 ? block : block.slice(0, newline)).replace(/^#+\s*/, "");
      const rest = newline === -1 ? "" : block.slice(newline + 1).replace(/\s*\n\s*/g, " ").trim();
      return rest
        ? [{ kind: "heading" as const, text: heading }, { kind: "text" as const, text: rest }]
        : [{ kind: "heading" as const, text: heading }];
    });

  return {
    title: fields.title ?? "the handbook",
    lead: fields.lead ?? "",
    blocks,
  };
}
