import { describe, expect, it } from "vitest";

import { LATEX, THESIS_RELEASES } from "./latex-facts";
import TYPING from "./latex-typing.json";

describe("the numbers of the LaTeX project", () => {
  it("tell one story about the thesis", () => {
    const last = THESIS_RELEASES.at(-1);
    expect(THESIS_RELEASES).toHaveLength(LATEX.thesis.releases);
    expect(last?.[2]).toBe(LATEX.thesis.pages);
    expect(last?.[3]).toBe(LATEX.thesis.words);
  });

  it("add the notes up from their two kinds", () => {
    const { notes } = LATEX;
    expect(notes.lecturePdfs + notes.examPdfs).toBe(notes.pdfs);
    expect(notes.lecturePages + notes.examPages).toBe(notes.pages);
  });
});

describe("the typed line", () => {
  it("ends as the record says, after every compile", () => {
    const last = TYPING.steps.at(-1);
    expect(last?.buffer).toBe(TYPING.line);
    expect(last?.render).toBe(TYPING.renders.length - 1);
    expect(TYPING.steps.reduce((sum, step) => sum + step.keys.length, 0)).toBe(TYPING.keys);
  });

  it("draws only the glyphs it has", () => {
    const names = new Set(Object.keys(TYPING.glyphs));
    const used = TYPING.renders.flatMap((render) => render.marks.map(([name]) => String(name)));
    expect(used.filter((name) => !names.has(name))).toEqual([]);
  });
});
