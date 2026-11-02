import { all, element, find, isStill, isWide, session } from "./dom";
import type { makeLanes } from "./figures";
import type { Graph } from "./graph";
import { fill, type Remark, type VaultStrings } from "./strings";

const RUN_KEY = "flow-run";
const STYLE_NAMES: Record<string, { font: string; tokens: string[] }> = {
  a: { font: "Geist", tokens: ["#0e1330", "#1a2147", "#eef0ff", "#f5c26b"] },
  b: { font: "Geologica", tokens: ["#f4efe6", "#fffdf8", "#211c16", "#d9573f"] },
  c: { font: "Nunito", tokens: ["#efeaff", "#ffffff", "#2a2352", "#5b3df5"] },
  d: { font: "Geologica", tokens: ["#070707", "#171717", "#ffffff", "#d4ff3f"] },
  e: { font: "JetBrains Mono", tokens: ["#e8eef1", "#ffffff", "#102027", "#0f6e84"] },
  f: { font: "Golos Text", tokens: ["#ffe6d6", "#fff5ee", "#3a1a12", "#c8391f"] },
};
const TOKEN_NAMES = ["Surface", "Card", "Text", "Accent"];

type Step =
  | { cmd: string; lane?: number; say?: boolean; edit?: boolean; stage?: string }
  | { s: string; file?: string; also?: string; lane?: number }
  | { ask: "style" | "stop"; lane: number }
  | { fin: "stage1Done" | "stage2Done" | "closed"; lane?: number };

/** The run of the made-up task: the real step names of the two stages, in their real order. */
const RUN: Step[] = [
  { cmd: "new-app 000", lane: 0 },
  { s: "s1.start", file: "state", lane: 1 },
  { s: "s1.brief", file: "brief" },
  { s: "s1.visual" },
  { s: "s1.board" },
  { ask: "style", lane: 2 },
  { s: "s1.style", file: "style", lane: 3 },
  { s: "s1.product", file: "research", also: "decisions" },
  { s: "s1.screens", file: "screens" },
  { s: "s1.file" },
  { s: "s1.tokens" },
  { s: "s1.wireframes" },
  { s: "s1.pages" },
  { s: "s1.audit" },
  { s: "s1.deliver" },
  { fin: "stage1Done", lane: 4 },
  { cmd: "edits", edit: true },
  { cmd: "stage-2", say: true, stage: "stage2", lane: 5 },
  { s: "s2.start" },
  { s: "s2.trend" },
  { s: "s2.base" },
  { s: "s2.components" },
  { s: "s2.key" },
  { ask: "stop", lane: 6 },
  { s: "s2.rest", lane: 7 },
  { s: "s2.unify" },
  { s: "s2.map" },
  { s: "s2.cover" },
  { s: "s2.icons" },
  { s: "s2.preview" },
  { s: "s2.assets" },
  { s: "s2.asc" },
  { s: "s2.pages" },
  { s: "s2.audit" },
  { s: "s2.deliver" },
  { fin: "stage2Done", lane: 8 },
  { cmd: "done", stage: "done", lane: 9 },
  { s: "harvest" },
  { fin: "closed" },
];
const STAGE_TWO = 17;
const CLOSING = 36;

/** How far the run must be when a heading of the main note is reached. */
const SCENES: Record<string, number> = { 0: 1, 1: 5, 2: 23, 3: 23, 4: 24, 5: RUN.length };

const COMMANDS = [
  "help",
  "new-app",
  "edits",
  "stage-2",
  "continue",
  "done",
  "state",
  "rules",
  "critic",
  "audit",
  "open ",
  "ls",
  "graph",
  "clear",
  "run",
  "theme ",
];

const stepKey = (id: string) => id.replace(/\.(\w)/, (_, letter: string) => letter.toUpperCase());

function escape(text: string) {
  return text.replace(
    /[&<>]/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] ?? char,
  );
}

interface SavedRun {
  i: number;
  style: string;
  made: string[];
  stage: string;
  phase: string;
  finished: boolean;
  lane: number;
}

function readSaved(): SavedRun | null {
  try {
    return JSON.parse(session.read(RUN_KEY) ?? "null") as SavedRun | null;
  } catch {
    return null;
  }
}

export interface TerminalHost {
  root: HTMLElement;
  strings: VaultStrings;
  graph: Graph;
  lanes: ReturnType<typeof makeLanes>;
  noteIds: string[];
  titleOf: (id: string) => string;
  isTask: (id: string) => boolean;
  go: (id: string) => boolean;
  openSheet: () => void;
  signal: AbortSignal;
}

export function makeTerminal(host: TerminalHost) {
  const { root, strings, graph, lanes, signal } = host;
  const t = strings.terminal;
  const pane = find("#term");
  const log = find("#term-log");
  const input = find<HTMLInputElement>("#term-in");
  const ghost = find("#term-ghost");
  const chips = find("#term-chips");
  const now = find("#term-now");
  const autoButton = find("#auto-button");

  const state = {
    i: 0,
    target: 0,
    auto: !isStill(),
    wait: null as "style" | "stop" | null,
    hold: false,
    style: "c",
    made: new Set<string>(),
    stage: "stage1",
    phase: "s1.start",
    finished: false,
    running: false,
    ruled: false,
  };
  let answerWait: (() => void) | null = null;
  let rearm: (() => void) | null = null;
  let wakeSleep: (() => void) | null = null;

  const fast = () => isStill() || state.i < state.target;

  function sleep(ms: number) {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, ms);
      wakeSleep = () => {
        clearTimeout(timer);
        resolve();
      };
    });
  }

  function line(html: string, kind = "") {
    const node = element("div", `l ${kind}`);
    node.innerHTML = html;
    const stick = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    log.appendChild(node);
    if (stick) log.scrollTop = log.scrollHeight;
    return node;
  }
  const say = (text: string, kind = "dim") => {
    line(`<span class="mk">${kind === "ok" ? "✓" : "·"}</span>${escape(text)}`, kind);
  };

  function writeState() {
    const text = JSON.stringify(
      {
        task: "000",
        app: "App Name",
        stage: state.stage,
        phase: state.phase,
        updated: "2026-11-01",
        waiting_for: state.wait === "stop" ? "stop-review" : state.wait,
        steps_done: RUN.slice(0, state.i).filter((step) => "s" in step).length,
      },
      null,
      2,
    );
    for (const code of all("[data-state-json] code", root)) code.textContent = text;
  }

  function setNow(html: string, asking = false) {
    now.innerHTML = html;
    if (asking) now.dataset.ask = "";
    else now.removeAttribute("data-ask");
    const status =
      state.i === 0 && !state.running
        ? t.notStarted
        : state.wait
          ? `${state.phase}, ${state.wait === "style" ? t.waitStyle : t.waitStop}`
          : state.finished
            ? t.closed
            : state.phase;
    for (const node of all("[data-run-status]", root)) node.textContent = status;
    writeState();
  }

  function persist() {
    session.write(
      RUN_KEY,
      JSON.stringify({
        i: state.i,
        style: state.style,
        made: [...state.made],
        stage: state.stage,
        phase: state.phase,
        finished: state.finished,
        lane: lanes.reached(),
      }),
    );
  }

  function make(id: string, quiet = false) {
    if (state.made.has(id)) return;
    state.made.add(id);
    const row = root.querySelector<HTMLElement>(`#tree .nav-file[data-note="${id}"]`);
    if (row) {
      row.dataset.made = "";
      if (!quiet) {
        row.dataset.new = "";
        setTimeout(() => {
          row.removeAttribute("data-new");
        }, 1700);
      }
    }
    graph.show(id);
    if (!quiet && !fast()) graph.pulse(id);
  }

  async function typeCommand(command: string) {
    const node = line('<span class="p">$</span> <span class="typing"></span>', "cmd");
    const text = find(".typing", node);
    if (fast()) {
      text.textContent = command;
      text.classList.remove("typing");
      return;
    }
    for (const letter of command) {
      text.textContent += letter;
      await sleep(34);
      if (fast()) {
        text.textContent = command;
        break;
      }
    }
    text.classList.remove("typing");
    await sleep(240);
  }

  async function runStep(step: { s: string; file?: string; also?: string }) {
    const text = t.steps[stepKey(step.s)] ?? "";
    state.phase = step.s;
    setNow(`<b>${step.s}</b> ${escape(text)}`);
    const node = line(
      `<span class="mk">·</span><span class="id">${step.s}</span><span class="tx">${escape(text)}</span>`,
      "step dim",
    );
    await sleep(fast() ? 0 : 420 + Math.random() * 380);
    node.className = "l step ok";
    find(".mk", node).textContent = "✓";
    if (step.file) {
      make(step.file);
      find(".tx", node).insertAdjacentHTML(
        "beforeend",
        `  <a data-note="${step.file}" href="#${step.file}">${escape(host.titleOf(step.file))}</a>`,
      );
    }
    if (step.also) make(step.also);
    if (!fast()) {
      graph.pulse(
        step.file ??
          (step.s.startsWith("s1") ? "stage-1" : step.s.startsWith("s2") ? "stage-2" : "done"),
      );
    }
  }

  function setChips(list: { label: string; value: string; ask?: boolean }[]) {
    chips.textContent = "";
    for (const item of list) {
      const chip = element("button", `chip${item.ask ? " ask" : ""}`, item.label);
      chip.type = "button";
      chip.dataset.value = item.value;
      chips.appendChild(chip);
    }
  }

  const styleChips = () =>
    ["a", "b", "c", "d", "e", "f"].map((look) => ({
      label: look.toUpperCase(),
      value: look,
      ask: true,
    }));
  const stopChips = () => [
    { label: t.next, value: t.next, ask: true },
    { label: t.editsChip, value: "edits" },
  ];
  const baseChips = () => {
    if (state.wait) return [];
    const tools = ["rules", "critic", "help"].map((value) => ({ label: value, value }));
    if (!state.auto && state.i < RUN.length) {
      return [{ label: "continue", value: "continue", ask: true }, ...tools];
    }
    return [...tools, ...["state", "graph", "run"].map((value) => ({ label: value, value }))];
  };
  const restoreChips = () => {
    setChips(
      state.wait === "stop" ? stopChips() : state.wait === "style" ? styleChips() : baseChips(),
    );
  };

  function answer() {
    state.wait = null;
    state.hold = false;
    setChips(baseChips());
    const resolve = answerWait;
    answerWait = null;
    resolve?.();
  }

  async function ask(kind: "style" | "stop") {
    state.wait = kind;
    const question = kind === "style" ? t.askStyle : t.askStop;
    line(`<span class="mk">?</span>${escape(question)}`, "ask");
    setNow(escape(kind === "style" ? t.askStyle : t.askStopShort), true);
    setChips(kind === "style" ? styleChips() : stopChips());
    let timer = 0;
    const settle = () => {
      if (state.wait !== kind || state.hold) return;
      if (kind === "style") pickStyle(state.style, true);
      else {
        say(t.autoNext);
        answer();
      }
    };
    rearm = () => {
      clearTimeout(timer);
      if (fast()) settle();
      else if (state.auto && !state.hold) timer = window.setTimeout(settle, 8000);
    };
    const done = new Promise<void>((resolve) => {
      answerWait = resolve;
    });
    rearm();
    await done;
    clearTimeout(timer);
    rearm = null;
    persist();
  }

  function pickStyle(look: string, byReplay = false) {
    state.style = look;
    const info = STYLE_NAMES[look];
    const name = strings.board[look] ?? look;
    for (const node of all("[data-sk]", root)) node.dataset.style = look;
    for (const button of all(".sdir", root)) {
      button.setAttribute("aria-checked", String(button.dataset.dir === look));
    }
    for (const node of all("[data-style-name]", root)) {
      node.textContent = `${look.toUpperCase()}, ${name}`;
    }
    for (const node of all("[data-style-font]", root)) node.textContent = info?.font ?? "";
    for (const node of all("[data-style-tokens]", root)) {
      node.innerHTML = (info?.tokens ?? [])
        .map((token, index) => `<code>${TOKEN_NAMES[index] ?? ""} ${token}</code>`)
        .join(" ");
    }
    if (state.wait === "style") {
      const text = byReplay
        ? fill(t.autoChosen, look.toUpperCase())
        : fill(t.chosen, look.toUpperCase(), name);
      line(`<span class="mk">›</span>${escape(text)}`, byReplay ? "dim" : "");
      say(t.alone);
      answer();
    } else if (state.i > 5) {
      say(`style.md: ${look.toUpperCase()}, ${name} · tokens.js`);
    }
    persist();
  }

  function addRule(remark: Remark) {
    if (state.ruled) return;
    state.ruled = true;
    for (const list of all("#rules ul[data-list]", root)) {
      const item = element("li");
      item.dataset.new = "";
      item.innerHTML = `<code>${remark.id}</code> ${escape(remark.line)}`;
      list.prepend(item);
    }
    for (const node of all('#tree [data-note="rules"] .nav-count', root)) {
      node.textContent = "234 + 1";
    }
  }

  async function editsScene(remark: Remark, added: boolean) {
    state.phase = "edits";
    setNow(`<b>edits</b> ${escape(remark.quote)}`);
    line(`<span class="mk">›</span>«${escape(remark.quote)}»`);
    await sleep(fast() ? 0 : 700);
    say(remark.what);
    await sleep(fast() ? 0 : 700);
    if (added) addRule(remark);
    line(
      `<span class="mk">✓</span><a data-note="rules" href="#rules">${remark.id}</a>  ${escape(remark.line)}`,
      "ok",
    );
    graph.pulse("checklists");
    await sleep(fast() ? 0 : 500);
  }

  async function runner() {
    if (state.running) return;
    state.running = true;
    while (state.i < RUN.length && !signal.aborted) {
      if (!state.auto && state.i >= state.target) break;
      if (document.hidden && !fast()) {
        await sleep(400);
        continue;
      }
      const step = RUN[state.i] as Step;
      if ("lane" in step && step.lane !== undefined) lanes.reach(step.lane);
      if ("cmd" in step) {
        if (step.stage) state.stage = step.stage;
        await typeCommand(step.cmd);
        if (step.say) say(t.goSay);
        if (step.edit) await editsScene(t.remarks.label, true);
      } else if ("s" in step) {
        await runStep(step);
      } else if ("ask" in step) {
        await ask(step.ask);
      } else {
        line(`<span class="mk">✓</span>${escape(t[step.fin])}`, "done");
        setNow(`<b>${escape(t[step.fin])}</b>`);
        await sleep(fast() ? 0 : 1200);
      }
      state.i += 1;
      persist();
      if (!fast() && "s" in step) await sleep(120);
    }
    state.running = false;
    if (state.i >= RUN.length) {
      state.finished = true;
      state.auto = false;
      persist();
      paintAuto();
      setChips(baseChips());
      setNow(`<b>${escape(t.closed)}</b>`);
    }
  }

  function paintAuto() {
    const on = state.auto && state.i < RUN.length;
    autoButton.dataset.on = on ? "true" : "false";
    autoButton.setAttribute("aria-label", on ? t.pause : t.play);
  }

  function pause() {
    state.auto = false;
    state.target = state.i;
    paintAuto();
    setChips(baseChips());
    rearm?.();
  }

  function resume() {
    state.auto = true;
    paintAuto();
    if (state.wait) {
      rearm?.();
      return;
    }
    setChips(baseChips());
    void runner();
  }

  function jump(index: number) {
    state.auto = true;
    state.target = Math.max(state.target, index);
    paintAuto();
    rearm?.();
    wakeSleep?.();
    void runner();
  }

  /** A heading of the note catches the run up, unless the reader has taken the terminal over. */
  function catchUp(scene: string) {
    const to = SCENES[scene];
    if (to === undefined || !state.auto || to <= state.target) return;
    state.target = Math.min(to, RUN.length);
    if (state.i < state.target) {
      rearm?.();
      wakeSleep?.();
    }
  }

  function openPane() {
    if (isWide()) pane.dataset.open = "";
    else if (!("open" in pane.dataset)) host.openSheet();
  }

  function completion(value: string) {
    if (!value) return "";
    if (value.startsWith("open ")) {
      const hit = host.noteIds.find((id) => id.startsWith(value.slice(5)));
      return hit ? `open ${hit}` : "";
    }
    return COMMANDS.find((command) => command.startsWith(value)) ?? "";
  }
  function paintGhost() {
    const hit = completion(input.value);
    ghost.textContent = hit && hit !== input.value ? hit : "";
  }

  const history: string[] = [];
  let historyAt = 0;

  function command(raw: string) {
    const value = raw.trim();
    const low = value.toLowerCase();
    const parts = low.split(/\s+/);
    const name = parts[0] ?? "";
    const rest = value.slice(name.length).trim();
    line(`<span class="p">$</span> ${escape(value)}`, "cmd");
    openPane();
    if (state.wait === "style" && /^[a-f]$/.test(low)) {
      pickStyle(low);
      return;
    }
    if (state.wait === "stop" && (low === t.next || low === "next")) {
      answer();
      return;
    }
    if (state.wait) {
      state.hold = true;
      rearm?.();
    }
    switch (name) {
      case "help":
        say(t.intro);
        for (const item of Object.values(t.help)) {
          line(
            `<span class="mk"> </span><span class="id">${escape(item.name)}</span><span class="tx">${escape(item.text)}</span>`,
            "step",
          );
        }
        break;
      case "ls":
        say(host.noteIds.join("  "));
        break;
      case "open":
      case "cat": {
        const id = parts[1] ?? "";
        if (host.go(id)) say(fill(t.opened, host.titleOf(id)), "ok");
        else say(fill(t.noFile, id));
        break;
      }
      case "graph":
        host.go("graph");
        break;
      case "clear":
        log.textContent = "";
        break;
      case "state":
        make("state", true);
        host.go("state");
        break;
      case "rules":
        for (const text of t.rules.split("\n")) say(text);
        host.go("rules");
        break;
      case "critic":
        for (const text of t.critic.split("\n")) line(escape(text), "dim");
        break;
      case "audit":
        for (const text of t.audit.split("\n")) line(escape(text), "dim");
        break;
      case "run":
        session.write(RUN_KEY, null);
        location.hash = "";
        location.reload();
        break;
      case "theme": {
        const mode = parts[1];
        if (mode === "light" || mode === "dark")
          root.ownerDocument.documentElement.dataset.theme = mode;
        else if (mode === "system") delete root.ownerDocument.documentElement.dataset.theme;
        else say("theme light | dark | system");
        break;
      }
      case "new-app":
        if (state.i > 0) say(t.running);
        else jump(0);
        break;
      case "stage-2":
        if (state.i >= STAGE_TWO) say(t.running);
        else jump(STAGE_TWO);
        break;
      case "done":
        if (state.i >= CLOSING) say(t.running);
        else jump(CLOSING);
        break;
      case "continue":
        if (state.wait) say(fill(t.waitingFor, state.wait === "stop" ? "stop-review" : "style"));
        else if (state.i >= RUN.length) say(t.nothing);
        else {
          say(fill(t.resumed, state.phase), "ok");
          resume();
        }
        break;
      case "edits": {
        if (!rest) {
          say(t.remarkAsk);
          setChips(
            Object.values(t.remarks).map((remark, index) => ({
              label: remark.chip,
              value: `edits ${remark.chip}`,
              ask: index === 2,
            })),
          );
          break;
        }
        const remark = Object.values(t.remarks).find((each) => low.includes(each.key));
        if (remark) void editsScene(remark, remark === t.remarks.label).then(restoreChips);
        else say(fill(t.freeRemark, rest));
        break;
      }
      default:
        say(fill(t.unknown, name));
    }
  }

  input.addEventListener("input", paintGhost, { signal });
  input.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Tab") {
        const hit = completion(input.value);
        if (hit) {
          event.preventDefault();
          input.value = hit;
          paintGhost();
        }
      } else if (event.key === "ArrowUp" && history.length > 0) {
        event.preventDefault();
        historyAt = Math.max(0, historyAt - 1);
        input.value = history[historyAt] ?? "";
        paintGhost();
      } else if (event.key === "ArrowDown" && history.length > 0) {
        event.preventDefault();
        historyAt = Math.min(history.length, historyAt + 1);
        input.value = history[historyAt] ?? "";
        paintGhost();
      } else if (event.key === "l" && event.ctrlKey) {
        event.preventDefault();
        log.textContent = "";
      }
    },
    { signal },
  );
  find("#term-form").addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      const value = input.value.trim();
      input.value = "";
      paintGhost();
      if (value) {
        history.push(value);
        historyAt = history.length;
        command(value);
      }
    },
    { signal },
  );
  chips.addEventListener(
    "click",
    (event) => {
      const chip = (event.target as Element).closest<HTMLElement>(".chip");
      if (chip?.dataset.value) command(chip.dataset.value);
    },
    { signal },
  );
  log.addEventListener(
    "click",
    (event) => {
      const selection = getSelection();
      if ((selection?.isCollapsed ?? true) && !(event.target as Element).closest("a") && isWide()) {
        input.focus({ preventScroll: true });
      }
    },
    { signal },
  );

  function start() {
    const saved = readSaved();
    for (const node of all("[data-run-status]", root)) node.textContent = t.notStarted;
    setNow(escape(t.notStarted));
    setChips(baseChips());
    paintAuto();
    pickStyle(saved?.style ?? "c");

    if (saved && saved.i > 0 && !isStill()) {
      saved.made.forEach((id) => {
        make(id, true);
      });
      state.stage = saved.stage;
      state.phase = saved.phase;
      lanes.reach(saved.lane);
      state.i = saved.i;
      if (saved.finished || state.i >= RUN.length) {
        state.finished = true;
        state.auto = false;
        state.i = RUN.length;
        say(t.nothing);
        setNow(`<b>${escape(t.closed)}</b>`);
      } else {
        state.auto = false;
        state.target = state.i;
        say(fill(t.broke, state.phase));
        setNow(escape(fill(t.broke, state.phase)));
      }
      paintAuto();
      setChips(baseChips());
    } else if (isStill()) {
      state.target = RUN.length;
      state.auto = false;
      paintAuto();
      for (const id of host.noteIds) if (host.isTask(id)) make(id, true);
      void runner();
    } else {
      const timer = setTimeout(() => void runner(), 1400);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
      });
    }
  }

  signal.addEventListener("abort", () => {
    wakeSleep?.();
    answerWait?.();
  });

  return {
    start,
    catchUp,
    make,
    pickStyle,
    openPane,
    command,
    togglePause() {
      if (state.auto) pause();
      else resume();
    },
    focus() {
      openPane();
      input.focus({ preventScroll: true });
    },
    pane,
  };
}

export type Terminal = ReturnType<typeof makeTerminal>;
