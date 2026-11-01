import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Locale } from "@/i18n/locales";

export interface NoteProperty {
  key: string;
  value: string;
}

export interface NoteSource {
  /** The note's name in the tree, the tab and the breadcrumb, as a file is named. */
  title: string;
  /** The title at the top of the note. */
  heading: string;
  properties: NoteProperty[];
  body: string;
  /** The whole file, for the source view. */
  raw: string;
}

const FRONT_MATTER = /^---\n([\s\S]*?)\n---\n+/;

/** Splits a note's file into its front matter and its Markdown. */
export function parseNote(raw: string): NoteSource {
  const match = FRONT_MATTER.exec(raw);
  const fields = (match?.[1] ?? "").split("\n").map((line) => {
    const at = line.indexOf(": ");
    return { key: line.slice(0, at), value: line.slice(at + 2) };
  });
  const field = (key: string) => fields.find((item) => item.key === key)?.value ?? "";
  return {
    title: field("title"),
    heading: field("heading"),
    properties: fields.filter(({ key }) => key !== "title" && key !== "heading"),
    body: raw.slice(match?.[0].length ?? 0),
    raw,
  };
}

/** Read at build: the site is static, and the vault is a folder of files. */
export function readNote(locale: Locale, id: string): NoteSource {
  return parseNote(
    readFileSync(join(process.cwd(), "messages", locale, "vault", `${id}.md`), "utf8"),
  );
}
