import { describe, expect, it } from "vitest";

import { CATALOG } from "@/i18n/catalog";
import { LOCALES } from "@/i18n/locales";

import { CLOSING, completion, parseSaved, RUN, STAGE_TWO, stepKey } from "./terminal";

describe("the run of the terminal", () => {
  const steps = RUN.flatMap((step) => ("s" in step ? [step.s] : []));

  it("names a step's words by its id", () => {
    expect(stepKey("s1.start")).toBe("s1Start");
    expect(stepKey("s2.asc")).toBe("s2Asc");
    expect(stepKey("harvest")).toBe("harvest");
  });

  it.each(LOCALES)("has the words of every step in %s, and none other", (locale) => {
    const words = CATALOG[locale].flow.terminal.steps as Record<string, string>;
    const keys = steps.map(stepKey);
    expect(new Set(keys).size).toBe(steps.length);
    expect(keys.toSorted()).toEqual(Object.keys(words).toSorted());
    for (const key of keys) expect(words[key]?.trim()).toBeTruthy();
  });

  it("starts the second stage and the closing where their commands are", () => {
    expect(RUN[STAGE_TWO]).toMatchObject({ cmd: "stage-2" });
    expect(RUN[CLOSING]).toMatchObject({ cmd: "done" });
  });
});

describe("the completion of a command", () => {
  const notes = ["flow", "flow-board", "rules"];

  it.each([
    ["", ""],
    ["he", "help"],
    ["help", "help"],
    ["st", "stage-2"],
    ["stat", "state"],
    ["th", "theme "],
    ["o", "open "],
    ["open ", "open flow"],
    ["open flow-", "open flow-board"],
    ["open r", "open rules"],
    ["open x", ""],
    ["xyz", ""],
    ["Help", ""],
  ])("finishes %j as %j", (value, hit) => {
    expect(completion(value, notes)).toBe(hit);
  });
});

describe("the run a tab kept", () => {
  const run = {
    i: 5,
    style: "c",
    made: ["state", "brief"],
    stage: "stage1",
    phase: "s1.board",
    finished: false,
    lane: 2,
  };

  it("comes back as it was kept", () => {
    expect(parseSaved(JSON.stringify(run))).toEqual(run);
  });

  it.each([
    ["nothing", null],
    ["broken JSON", "{"],
    ["a bare value", "5"],
    ["no notes made", JSON.stringify({ ...run, made: undefined })],
    ["a note that is no name", JSON.stringify({ ...run, made: ["state", 3] })],
    ["a step between steps", JSON.stringify({ ...run, i: 1.5 })],
    ["a step as text", JSON.stringify({ ...run, i: "5" })],
    ["a look the board has not", JSON.stringify({ ...run, style: "z" })],
    ["a name every object has", JSON.stringify({ ...run, style: "toString" })],
    ["no lane", JSON.stringify({ ...run, lane: undefined })],
    ["a finish as text", JSON.stringify({ ...run, finished: "false" })],
  ])("is dropped with %s", (_, raw) => {
    expect(parseSaved(raw)).toBeNull();
  });
});
