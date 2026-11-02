import { describe, expect, it } from "vitest";

import { NOTE_IDS } from "./notes";
import { parseBlocks } from "./markdown";
import { parseNote, readNote } from "./vault-source";

describe("the vault's notes", () => {
  it("keep their live properties exactly as the page reads them", () => {
    for (const locale of ["ru", "en"] as const) {
      for (const id of NOTE_IDS) {
        const { title, heading, properties } = readNote(locale, id);
        expect(title, id).not.toBe("");
        expect(heading, id).not.toBe("");
        for (const { value } of properties) expect(value, `${locale}/${id}`).not.toMatch(/^\{ /);
      }
    }
  });
});

describe("the vault's Markdown", () => {
  it("splits a note into front matter and body", () => {
    const note = parseNote("---\ntitle: brief\nheading: Бриф\nзадача: 000\n---\n\nТекст.\n");
    expect(note.title).toBe("brief");
    expect(note.heading).toBe("Бриф");
    expect(note.properties).toEqual([{ key: "задача", value: "000" }]);
    expect(note.body).toBe("Текст.\n");
  });

  it("reads a heading's scene, a table's numeric column and a callout", () => {
    const blocks = parseBlocks(
      "## Этап ^scene-2\n\n| Тема | Правил |\n| --- | ---: |\n| Иконка | 6 |\n\n> [!info] Важно\n> Текст\n",
    );
    expect(blocks).toEqual([
      { kind: "heading", level: 2, text: "Этап", scene: "2" },
      { kind: "table", head: ["Тема", "Правил"], numeric: [false, true], rows: [["Иконка", "6"]] },
      { kind: "callout", title: "Важно", text: "Текст" },
    ]);
  });

  it("keeps paragraphs, lists, code and embeds apart", () => {
    expect(parseBlocks("Раз\nдва\n\n- а\n- б\n\n```\nx\n```\n\n![[board]]\n")).toEqual([
      { kind: "paragraph", text: "Раз два" },
      { kind: "list", ordered: false, items: ["а", "б"] },
      { kind: "code", text: "x" },
      { kind: "embed", name: "board" },
    ]);
  });
});
