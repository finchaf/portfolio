import { isCalm } from "@/motion/reduced";
import { readTheme, saveTheme } from "@/themes/theme";

import { MAIN_NOTE, TASK_NOTES } from "../notes";
import { all, element, find, isWide } from "./dom";
import { makeLanes, setupCompare, setupLadder } from "./figures";
import { makeGraph } from "./graph";
import type { VaultStrings } from "./strings";
import { makeTerminal } from "./terminal";

const MAX_TABS = 5;
const THUMB_MIN = 45;

interface Meta {
  element: HTMLElement;
  title: string;
  folder: string;
}

/** Everything that happens on the page after the HTML has arrived. */
export function startVault(strings: VaultStrings, signal: AbortSignal) {
  const vault = find("#vault");
  const notesRoot = find("#notes");
  const ui = strings.ui;
  const on = { signal };

  /* ---------- the notes ---------- */
  const meta = new Map<string, Meta>();
  for (const article of all("article.vault-note", notesRoot)) {
    const id = article.dataset.note ?? "";
    meta.set(id, {
      element: article,
      title: article.dataset.title ?? ui.graphTitle ?? "",
      folder: article.dataset.folder ?? "",
    });
  }
  const titleOf = (id: string) => meta.get(id)?.title ?? id;
  const noteIds = [...meta.keys()].filter((id) => id !== "graph");
  const linksOf = (article: HTMLElement) => [
    ...new Set(
      all("a[data-note]", find(".vault-note-view", article))
        .map((link) => link.dataset.note ?? "")
        .filter((id) => id !== article.dataset.note && id !== "graph"),
    ),
  ];
  const outgoing = new Map(noteIds.map((id) => [id, linksOf((meta.get(id) as Meta).element)]));

  // The notes that link to each note close it, as the app's embedded backlinks do. They go with
  // the script that added them, so a second start (StrictMode in development) adds no second box.
  const backlinks: HTMLElement[] = [];
  for (const id of noteIds) {
    const from = noteIds.filter((other) => outgoing.get(other)?.includes(id));
    if (from.length === 0) continue;
    const box = element("div", "vault-backlinks");
    box.append(element("p", "", ui.backlinks));
    for (const other of from) box.append(noteLink(other));
    find(".vault-note-view", (meta.get(id) as Meta).element).append(box);
    backlinks.push(box);
  }
  signal.addEventListener("abort", () => {
    for (const box of backlinks) box.remove();
  });

  function noteLink(id: string) {
    const link = element("a", "vault-internal-link", titleOf(id));
    link.href = `#${id}`;
    link.dataset.note = id;
    return link;
  }

  const edges: [string, string][] = [];
  for (const [id, links] of outgoing) {
    for (const target of links) {
      if (!edges.some(([a, b]) => (a === target && b === id) || (a === id && b === target))) {
        edges.push([id, target]);
      }
    }
  }
  for (const id of TASK_NOTES) {
    if (!edges.some(([a, b]) => a === id || b === id)) edges.push(["stage-1", id]);
  }

  /* ---------- the parts ---------- */
  const lanes = makeLanes(vault);
  const compare = setupCompare(vault, signal);
  setupLadder(vault, signal);
  const graph = makeGraph({
    notes: noteIds.map((id) => ({
      id,
      label: titleOf(id),
      hidden: TASK_NOTES.includes(id) && !isCalm(),
    })),
    links: edges,
    hubLabel: (id) => strings.checklists[id] ?? id,
    open: (id) => {
      go(id);
    },
    signal,
  });
  graph.attach(find<HTMLCanvasElement>("#graph-mini"), false);
  graph.attach(find<HTMLCanvasElement>("#graph-full"), true);

  /* ---------- tabs and addresses ---------- */
  const tabList = find("#tab-list");
  const openTabs: string[] = [];
  let current = "";
  let position = 0;
  let furthest = 0;

  function renderTabs() {
    tabList.textContent = "";
    for (const id of openTabs) {
      const tab = element("div", "vault-tab");
      tab.dataset.tab = id;
      if (id === current) tab.dataset.on = "";
      const open = element("button", "vault-tab-go", titleOf(id));
      open.type = "button";
      if (id === current) open.setAttribute("aria-current", "page");
      const close = element("button", "vault-tab-x");
      close.type = "button";
      close.setAttribute("aria-label", ui.closeTab ?? "");
      close.dataset.closeTab = id;
      close.innerHTML =
        '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      tab.append(open, close);
      tabList.append(tab);
    }
  }

  function renderCrumb() {
    const { folder, title } = meta.get(current) as Meta;
    for (const box of [find("#view-crumb"), find("#mobile-crumb")]) {
      box.textContent = "";
      if (folder) {
        box.append(element("span", "vault-crumb", folder), element("span", "vault-crumb-sep", "/"));
      }
      box.append(element("span", "vault-crumb-current", title));
    }
    faint(find('[data-action="back"]', vault), position === 0);
    faint(find('[data-action="forward"]', vault), position >= furthest);
  }

  /** An arrow with no step to take: `data-faint` draws it, `aria-disabled` says it. */
  function faint(button: HTMLElement, off: boolean) {
    button.toggleAttribute("data-faint", off);
    if (off) button.setAttribute("aria-disabled", "true");
    else button.removeAttribute("aria-disabled");
  }

  /** The pencil follows the note shown: pressed on its source, gone where there is none. */
  function paintSource() {
    const button = find('[data-action="source"]', vault);
    const source = (meta.get(current) as Meta).element.querySelector<HTMLElement>(
      "pre.vault-note-source",
    );
    button.hidden = !source;
    const showing = source ? !source.hidden : false;
    press(button, showing);
    button.dataset.tip = (showing ? ui.reading : ui.source) ?? "";
  }

  function apply(wanted: string) {
    const id = meta.has(wanted) ? wanted : MAIN_NOTE;
    for (const open of all(".vault-note[data-open]", notesRoot)) open.removeAttribute("data-open");
    (meta.get(id) as Meta).element.dataset.open = "";
    current = id;
    if (!openTabs.includes(id)) {
      openTabs.push(id);
      if (openTabs.length > MAX_TABS) openTabs.splice(1, 1);
    }
    renderTabs();
    renderCrumb();
    paintSource();
    for (const row of all("#tree .vault-nav-file")) {
      if (row.dataset.note === id) row.setAttribute("aria-current", "page");
      else row.removeAttribute("aria-current");
    }
    if (TASK_NOTES.includes(id)) terminal.make(id, true);
    graph.setCurrent(id);
    renderPanels();
    requestAnimationFrame(relayout);
  }

  /** Everything drawn to the note column's pixels, drawn again once the column has moved. */
  function relayout() {
    lanes.draw();
    compare.refresh();
    graph.refresh();
    paintThumb();
  }

  const scrollerY = () => window.scrollY;
  const jumpTo = (y: number) => {
    window.scrollTo({ top: y, behavior: "instant" });
  };

  function go(id: string) {
    if (!meta.has(id)) return false;
    const fromSheet = sheetOpen;
    closeSheets(true);
    if (fromSheet) {
      // The sheet's own step gives way: the note takes its place, or, for the note already shown,
      // it is gone. The note under the sheet has kept its place since the sheet opened.
      if (id !== current) {
        position += 1;
        furthest = position;
        history.replaceState({ flowY: 0, flowAt: position }, "", `#${id}`);
      } else {
        ignorePop = true;
        history.back();
      }
    } else {
      history.replaceState({ ...(history.state as object), flowY: scrollerY() }, "");
      if (id !== current) {
        position += 1;
        furthest = position;
        history.pushState({ flowY: 0, flowAt: position }, "", `#${id}`);
      }
    }
    apply(id);
    jumpTo(0);
    return true;
  }

  let ignorePop = false;
  window.addEventListener(
    "popstate",
    (event) => {
      if (ignorePop) {
        ignorePop = false;
        return;
      }
      if (sheetOpen) {
        closeSheets(true);
        return;
      }
      const state = (event.state ?? {}) as { flowY?: number; flowAt?: number };
      position = state.flowAt ?? 0;
      apply(location.hash.slice(1) || MAIN_NOTE);
      const y = state.flowY ?? 0;
      jumpTo(y);
      requestAnimationFrame(() => {
        jumpTo(y);
      });
    },
    on,
  );

  /* ---------- side panels ---------- */
  /** A toggle's state: `data-active` draws it, `aria-pressed` says it. */
  function press(button: HTMLElement, pressed: boolean) {
    button.toggleAttribute("data-active", pressed);
    button.setAttribute("aria-pressed", String(pressed));
  }

  function setLeft(tab: string) {
    for (const panel of all("[data-left-panel]", vault)) {
      panel.hidden = panel.dataset.leftPanel !== tab;
    }
    for (const button of all("[data-left-tab]", vault)) {
      press(button, button.dataset.leftTab === tab);
    }
    if (tab === "search") {
      const input = find<HTMLInputElement>("#vault-search");
      input.focus();
      renderSearch(input.value);
    }
  }

  function setRight(tab: string) {
    for (const panel of all("[data-right-panel]", vault)) {
      panel.hidden = panel.dataset.rightPanel !== tab;
    }
    for (const button of all("[data-right-tab]", vault)) {
      press(button, button.dataset.rightTab === tab);
    }
    renderPanels();
    graph.refresh();
  }

  function listPanel(name: string, items: (HTMLElement | string)[]) {
    const panel = find(`[data-right-panel="${name}"]`, vault);
    panel.textContent = "";
    if (items.length === 0) {
      panel.append(element("p", "vault-panel-empty", ui.noBacklinks));
      return;
    }
    for (const item of items) {
      const row = element("div", "vault-panel-row");
      row.append(item);
      panel.append(row);
    }
  }

  function renderPanels() {
    // The graph is no note: nothing links to it, and its links are the whole vault's.
    const note = current !== "" && current !== "graph";
    listPanel(
      "backlinks",
      note ? noteIds.filter((id) => outgoing.get(id)?.includes(current)).map(noteLink) : [],
    );
    listPanel("outgoing", note ? (outgoing.get(current) ?? []).map(noteLink) : []);
    const counts = new Map<string, number>();
    for (const tag of all("[data-tag]", notesRoot)) {
      const name = tag.dataset.tag ?? "";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    listPanel(
      "tags",
      [...counts].map(([name, count]) => {
        const row = element("span", "vault-panel-pair");
        row.append(
          element("span", "vault-tag", `#${name}`),
          element("i", "vault-nav-count", String(count)),
        );
        return row;
      }),
    );
    const keys = new Map<string, number>();
    for (const key of all(".vault-metadata-property dt", notesRoot)) {
      const name = key.textContent;
      keys.set(name, (keys.get(name) ?? 0) + 1);
    }
    listPanel(
      "properties",
      [...keys].map(([name, count]) => {
        const row = element("span", "vault-panel-pair");
        row.append(element("span", "", name), element("i", "vault-nav-count", String(count)));
        return row;
      }),
    );
    renderOutline();
  }

  const outline = find("#outline");
  function renderOutline() {
    outline.textContent = "";
    const article = meta.get(current)?.element;
    if (!article) return;
    for (const heading of all("[data-outline]", article)) {
      const link = element("a", "", heading.textContent);
      link.href = `#${current}`;
      link.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          heading.scrollIntoView({ behavior: isCalm() ? "auto" : "smooth", block: "start" });
        },
        on,
      );
      outline.append(link);
    }
    spy();
  }

  function spy() {
    const article = meta.get(current)?.element;
    if (!article) return;
    const headings = all("[data-outline]", article);
    let best = -1;
    headings.forEach((heading, index) => {
      if (heading.getBoundingClientRect().top < window.innerHeight * 0.42) best = index;
    });
    all("a", outline).forEach((link, index) => {
      link.setAttribute("aria-current", String(index === best));
    });
  }

  /* ---------- the left panel's search ---------- */
  /** What a note says as read: no source, no other notes' links under it, no panel's labels. */
  function textOf(id: string) {
    const view = find(".vault-note-view", (meta.get(id) as Meta).element).cloneNode(
      true,
    ) as HTMLElement;
    for (const chrome of all(
      ".vault-backlinks, .vault-metadata-heading, .vault-metadata-add",
      view,
    ))
      chrome.remove();
    return view.textContent;
  }
  function matches(query: string) {
    const low = query.toLowerCase();
    return noteIds.filter((id) => `${titleOf(id)} ${textOf(id)}`.toLowerCase().includes(low));
  }
  function renderSearch(query: string) {
    const box = find("#vault-search-results");
    box.textContent = "";
    if (!query) return;
    for (const id of matches(query)) box.append(noteLink(id));
  }
  find<HTMLInputElement>("#vault-search").addEventListener(
    "input",
    (event) => {
      renderSearch((event.target as HTMLInputElement).value);
    },
    on,
  );

  /* ---------- the quick switcher ---------- */
  const prompt = find("#prompt");
  const promptInput = find<HTMLInputElement>("#prompt-input");
  const promptList = find("#prompt-list");
  let hits: { kind: "note" | "command"; id: string; title: string; hint: string }[] = [];
  let selected = 0;
  let returnFocus: HTMLElement | null = null;

  function openPrompt() {
    returnFocus = document.activeElement as HTMLElement | null;
    prompt.hidden = false;
    promptInput.value = "";
    promptInput.placeholder = ui.searchPlaceholder ?? "";
    renderPrompt("");
    promptInput.focus();
  }
  function closePrompt() {
    prompt.hidden = true;
    returnFocus?.focus({ preventScroll: true });
  }
  function renderPrompt(query: string) {
    const low = query.toLowerCase();
    const notes = [...meta.keys()].map((id) => ({
      kind: "note" as const,
      id,
      title: titleOf(id),
      hint: (meta.get(id) as Meta).folder || (ui.noteWord ?? ""),
    }));
    const commands = Object.values(strings.terminal.help).map((item) => ({
      kind: "command" as const,
      id: item.name,
      title: item.name,
      hint: item.text,
    }));
    hits = [...notes, ...commands]
      .filter((hit) => !low || `${hit.title} ${hit.hint}`.toLowerCase().includes(low))
      .slice(0, 12);
    selected = 0;
    promptList.textContent = "";
    hits.forEach((hit, index) => {
      const item = element("li");
      item.id = `prompt-option-${String(index)}`;
      item.setAttribute("role", "option");
      item.dataset.index = String(index);
      item.append(element("b", "", hit.title), element("span", "", hit.hint));
      promptList.append(item);
    });
    markSelected(all("li", promptList));
  }
  /** The arrows' choice, drawn by `data-selected` and read out through the input. */
  function markSelected(items: HTMLElement[]) {
    items.forEach((item, index) => {
      item.toggleAttribute("data-selected", index === selected);
      item.setAttribute("aria-selected", String(index === selected));
    });
    const chosen = items[selected];
    if (chosen) promptInput.setAttribute("aria-activedescendant", chosen.id);
    else promptInput.removeAttribute("aria-activedescendant");
  }
  function pick(index: number) {
    const hit = hits[index];
    if (!hit) return;
    closePrompt();
    if (hit.kind === "note") go(hit.id);
    else terminal.command(hit.id);
  }
  promptInput.addEventListener(
    "input",
    () => {
      renderPrompt(promptInput.value);
    },
    on,
  );
  promptInput.addEventListener(
    "keydown",
    (event) => {
      const items = all("li", promptList);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        selected = (selected + step + items.length) % items.length;
        markSelected(items);
        items[selected]?.scrollIntoView({ block: "nearest" });
      } else if (event.key === "Enter") {
        event.preventDefault();
        pick(selected);
      }
    },
    on,
  );
  promptList.addEventListener(
    "click",
    (event) => {
      const item = (event.target as Element).closest<HTMLElement>("li");
      if (item) pick(Number(item.dataset.index));
    },
    on,
  );
  prompt.addEventListener(
    "click",
    (event) => {
      if (event.target === prompt) closePrompt();
    },
    on,
  );

  /* ---------- notices, tooltips, menus ---------- */
  const notices = find("#notices");
  function notice(text: string) {
    const item = element("div", "vault-notice", text);
    notices.append(item);
    setTimeout(() => {
      item.remove();
    }, 3200);
  }

  const tooltip = element("div", "vault-tooltip");
  tooltip.hidden = true;
  document.body.append(tooltip);
  signal.addEventListener("abort", () => {
    tooltip.remove();
  });
  let tipTimer = 0;
  const hideTip = () => {
    clearTimeout(tipTimer);
    tooltip.hidden = true;
  };
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    vault.addEventListener(
      "mouseover",
      (event) => {
        const target = (event.target as Element).closest<HTMLElement>("[data-tip]");
        if (!target) return;
        clearTimeout(tipTimer);
        tipTimer = window.setTimeout(() => {
          tooltip.textContent = target.dataset.tip ?? "";
          tooltip.hidden = false;
          const box = target.getBoundingClientRect();
          const width = tooltip.offsetWidth;
          const left = Math.max(
            8,
            Math.min(innerWidth - width - 8, box.left + box.width / 2 - width / 2),
          );
          tooltip.style.left = `${String(left)}px`;
          tooltip.style.top = `${String(box.bottom + 6)}px`;
        }, 450);
      },
      on,
    );
    vault.addEventListener(
      "mouseout",
      (event) => {
        if ((event.target as Element).closest("[data-tip]")) hideTip();
      },
      on,
    );
  }

  let menu: HTMLElement | null = null;
  function closeMenu() {
    menu?.remove();
    menu = null;
  }
  function openMenu(
    anchor: HTMLElement,
    items: { label: string; run?: () => void; href?: string; on?: boolean }[],
    above = false,
  ) {
    closeMenu();
    const box = element("div", "vault-menu");
    box.setAttribute("role", "menu");
    for (const item of items) {
      const row = element(item.href ? "a" : "button", "vault-menu-item");
      row.setAttribute("role", "menuitem");
      row.textContent = item.label;
      if (item.on) row.dataset.on = "";
      if (item.href) (row as HTMLAnchorElement).href = item.href;
      else (row as HTMLButtonElement).type = "button";
      row.addEventListener(
        "click",
        () => {
          closeMenu();
          item.run?.();
        },
        on,
      );
      box.append(row);
    }
    document.body.append(box);
    const place = anchor.getBoundingClientRect();
    const left = Math.max(8, Math.min(innerWidth - box.offsetWidth - 8, place.left));
    box.style.left = `${String(left)}px`;
    box.style.top = `${String(above ? place.top - box.offsetHeight - 6 : place.bottom + 6)}px`;
    menu = box;
    (box.firstElementChild as HTMLElement | null)?.focus();
  }
  signal.addEventListener("abort", closeMenu);

  /* ---------- sheets on a phone ---------- */
  const scrim = find("#scrim");
  let sheetOpen = false;
  const pushSheet = () => {
    sheetOpen = true;
    // The note's own step keeps its place, for Back to find under the sheet's.
    history.replaceState({ ...(history.state as object), flowY: scrollerY() }, "");
    history.pushState({ ...(history.state as object), flowSheet: true }, "");
  };
  function openTree() {
    vault.dataset.tree = "";
    scrim.hidden = false;
    pushSheet();
  }
  function closeSheets(silent = false) {
    const was = sheetOpen;
    sheetOpen = false;
    delete vault.dataset.tree;
    scrim.hidden = true;
    if (!isWide()) terminal.pane.removeAttribute("data-open");
    if (was && !silent) {
      ignorePop = true;
      history.back();
    }
  }
  function toggleTerminal() {
    const pane = terminal.pane;
    if ("open" in pane.dataset) {
      pane.removeAttribute("data-open");
      if (!isWide() && sheetOpen) {
        sheetOpen = false;
        ignorePop = true;
        history.back();
      }
    } else {
      pane.dataset.open = "";
      if (!isWide()) {
        pushSheet();
        const log = find("#term-log");
        log.scrollTop = log.scrollHeight;
      }
    }
    requestAnimationFrame(paintThumb);
  }

  /* ---------- the note's scrollbar, as the app draws it on the pane ---------- */
  const thumb = find("#scroll-thumb");
  const rootSplit = find("#root-split");
  function paintThumb() {
    if (!isWide()) return;
    const header = find(".vault-view-header", rootSplit).getBoundingClientRect();
    const pane = terminal.pane.getBoundingClientRect();
    const top = header.bottom;
    const track = pane.top - top;
    const total = document.documentElement.scrollHeight;
    const visible = window.innerHeight;
    const footer =
      total - rootSplit.offsetHeight - rootSplit.getBoundingClientRect().top - scrollerY();
    const range = total - visible - Math.max(0, footer);
    if (range <= 4 || track <= 0) {
      thumb.hidden = true;
      return;
    }
    thumb.hidden = false;
    const size = Math.max(THUMB_MIN, (track * visible) / (range + visible));
    const share = Math.min(1, scrollerY() / range);
    const left = rootSplit.getBoundingClientRect().right - 12;
    thumb.style.height = `${String(size)}px`;
    thumb.style.transform = `translate(${String(left)}px, ${String(top + (track - size) * share)}px)`;
    thumb.dataset.track = String(track - size);
    thumb.dataset.range = String(range);
  }
  thumb.addEventListener(
    "pointerdown",
    (event) => {
      event.preventDefault();
      thumb.setPointerCapture(event.pointerId);
      const startY = event.clientY;
      const startScroll = scrollerY();
      const perPixel = Number(thumb.dataset.range) / Number(thumb.dataset.track);
      const move = (next: PointerEvent) => {
        jumpTo(startScroll + (next.clientY - startY) * perPixel);
      };
      // A cancelled pointer (a touch taken by a gesture) ends the drag as a lifted one does.
      const ends = ["pointerup", "pointercancel", "lostpointercapture"] as const;
      const up = () => {
        thumb.removeEventListener("pointermove", move);
        for (const type of ends) thumb.removeEventListener(type, up);
      };
      thumb.addEventListener("pointermove", move, on);
      for (const type of ends) thumb.addEventListener(type, up, on);
    },
    on,
  );

  /* ---------- hover preview ---------- */
  const preview = find("#preview");
  let previewTimer = 0;
  function hidePreview() {
    clearTimeout(previewTimer);
    preview.hidden = true;
  }
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    notesRoot.addEventListener(
      "mouseover",
      (event) => {
        const link = (event.target as Element).closest<HTMLElement>(
          ".vault-internal-link[data-note]",
        );
        const id = link?.dataset.note ?? "";
        const target = meta.get(id);
        if (!link || !target || id === current) return;
        clearTimeout(previewTimer);
        previewTimer = window.setTimeout(() => {
          const title =
            target.element.querySelector(".vault-inline-title")?.textContent ?? target.title;
          const text = target.element.querySelector(".vault-note-view > p")?.textContent ?? "";
          preview.textContent = "";
          preview.append(element("b", "", title), element("p", "", text));
          preview.hidden = false;
          const box = link.getBoundingClientRect();
          const height = preview.offsetHeight;
          preview.style.left = `${String(Math.min(innerWidth - preview.offsetWidth - 12, Math.max(12, box.left)))}px`;
          preview.style.top = `${String(box.bottom + height + 12 > innerHeight ? box.top - height - 8 : box.bottom + 8)}px`;
        }, 320);
      },
      on,
    );
    notesRoot.addEventListener(
      "mouseout",
      (event) => {
        if ((event.target as Element).closest(".vault-internal-link[data-note]")) hidePreview();
      },
      on,
    );
  }

  /* ---------- keys and clicks ---------- */
  document.addEventListener(
    "keydown",
    (event) => {
      const typing = /INPUT|TEXTAREA/.test((document.activeElement as HTMLElement).tagName);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPrompt();
      } else if (event.key === "Escape") {
        closeMenu();
        hidePreview();
        if (!prompt.hidden) closePrompt();
        else if (sheetOpen) closeSheets();
      } else if (!typing && event.key === "/") {
        event.preventDefault();
        openPrompt();
      } else if (!typing && event.key === "`") {
        event.preventDefault();
        terminal.focus();
      }
    },
    on,
  );

  function collapseAll() {
    const folders = all<HTMLDetailsElement>("#tree details");
    const anyOpen = folders.some((folder) => folder.open);
    for (const folder of folders) folder.open = !anyOpen;
  }

  function act(action: string, target: HTMLElement) {
    if (action.startsWith("note:")) {
      go(action.slice(5));
      return;
    }
    if (action.startsWith("left:")) {
      setLeft(action.slice(5));
      return;
    }
    if (action.startsWith("right:")) {
      setRight(action.slice(6));
      return;
    }
    switch (action) {
      case "toggle-left":
        target.setAttribute("aria-expanded", String(!vault.toggleAttribute("data-left-closed")));
        requestAnimationFrame(relayout);
        break;
      case "toggle-right":
        target.setAttribute("aria-expanded", String(!vault.toggleAttribute("data-right-closed")));
        requestAnimationFrame(relayout);
        break;
      case "tree":
        openTree();
        break;
      case "search":
        openPrompt();
        break;
      // A faint arrow has no step of the vault's to take: Back would leave the page.
      case "back":
        if (!("faint" in target.dataset)) history.back();
        break;
      case "forward":
        if (!("faint" in target.dataset)) history.forward();
        break;
      case "read-only":
        notice(ui.readOnly ?? "");
        break;
      case "sort": {
        for (const list of all(".vault-nav-children", vault)) list.toggleAttribute("data-reversed");
        break;
      }
      case "reveal":
        find('#tree .vault-nav-file[aria-current="page"]').scrollIntoView({ block: "nearest" });
        break;
      case "collapse":
        collapseAll();
        break;
      case "focus-terminal":
        terminal.focus();
        break;
      case "term-toggle":
        toggleTerminal();
        break;
      case "auto":
        terminal.togglePause();
        break;
      case "source": {
        const article = (meta.get(current) as Meta).element;
        const source = article.querySelector<HTMLElement>("pre.vault-note-source");
        if (!source) break;
        const showing = !source.hidden;
        source.hidden = showing;
        find(".vault-note-view", article).hidden = !showing;
        paintSource();
        break;
      }
      case "view-menu":
        openMenu(target, [
          {
            label: ui.copyLink ?? "",
            run: () => {
              // Refused, or no clipboard off a secure origin: no notice, as the copy button does.
              void (async () => {
                try {
                  await navigator.clipboard.writeText(location.href);
                } catch {
                  return;
                }
                notice(ui.copied ?? "");
              })();
            },
          },
          { label: ui.openGraph ?? "", run: () => go("graph") },
        ]);
        break;
      case "tab-menu":
        openMenu(
          target,
          openTabs.map((id) => ({ label: titleOf(id), on: id === current, run: () => go(id) })),
        );
        break;
      case "vault-menu":
        openMenu(
          target,
          strings.pages.map((page) => ({ label: page.label, href: page.href })),
          true,
        );
        break;
      case "settings-menu": {
        const theme = readTheme();
        const items = (["system", "light", "dark"] as const).map((mode) => ({
          label: ui[`theme${mode[0]?.toUpperCase() ?? ""}${mode.slice(1)}`] ?? mode,
          on: theme === mode,
          run: () => {
            saveTheme(mode);
          },
        }));
        const language = {
          label: strings.other.label,
          href: `/${strings.other.locale}/flow${location.hash}`,
        };
        openMenu(target, [...items, language], true);
        break;
      }
      case "graph-labels":
        graph.toggleLabels();
        press(target, !("active" in target.dataset));
        break;
      case "graph-animate":
        graph.animate();
        break;
    }
  }

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element;
      if (menu && !target.closest(".vault-menu")) closeMenu();
      const link = target.closest<HTMLAnchorElement>("a[data-note]");
      if (link && !(event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        hidePreview();
        go(link.dataset.note ?? "");
        return;
      }
      const look = target.closest<HTMLElement>(".vault-sdir");
      if (look?.dataset.dir) {
        terminal.pickStyle(look.dataset.dir);
        return;
      }
      const close = target.closest<HTMLElement>("[data-close-tab]");
      if (close?.dataset.closeTab) {
        const id = close.dataset.closeTab;
        const index = openTabs.indexOf(id);
        openTabs.splice(index, 1);
        if (openTabs.length === 0) openTabs.push(MAIN_NOTE);
        if (id === current) go(openTabs[Math.max(0, index - 1)] ?? MAIN_NOTE);
        else renderTabs();
        return;
      }
      const tab = target.closest<HTMLElement>("[data-tab]");
      if (tab?.dataset.tab) {
        go(tab.dataset.tab);
        return;
      }
      if (target.closest("[data-read-only]")) {
        notice(ui.readOnly ?? "");
        return;
      }
      const button = target.closest<HTMLElement>("[data-action]");
      if (button?.dataset.action && vault.contains(button)) act(button.dataset.action, button);
    },
    on,
  );
  find("#scrim").addEventListener(
    "click",
    () => {
      closeSheets();
    },
    on,
  );
  find(".vault-term-head", vault).addEventListener(
    "click",
    (event) => {
      if (!isWide() && !(event.target as Element).closest("[data-action]")) toggleTerminal();
    },
    on,
  );

  (function grip() {
    const handle = find("[data-grip]", vault);
    let dragging = false;
    let startY = 0;
    let startHeight = 0;
    handle.addEventListener(
      "pointerdown",
      (event) => {
        dragging = true;
        startY = event.clientY;
        startHeight = terminal.pane.offsetHeight;
        handle.setPointerCapture(event.pointerId);
        event.preventDefault();
      },
      on,
    );
    handle.addEventListener(
      "pointermove",
      (event) => {
        if (!dragging) return;
        const height = Math.max(
          112,
          Math.min(innerHeight * 0.7, startHeight + startY - event.clientY),
        );
        vault.style.setProperty("--term-height", `${String(height)}px`);
        paintThumb();
      },
      on,
    );
    // A cancelled pointer ends the drag too, or the next hover would still resize the pane.
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      handle.addEventListener(
        type,
        () => {
          dragging = false;
        },
        on,
      );
    }
  })();

  function onScroll() {
    spy();
    paintThumb();
    if (current !== MAIN_NOTE) return;
    for (const heading of all("[data-scene]", (meta.get(MAIN_NOTE) as Meta).element)) {
      if (heading.getBoundingClientRect().top < innerHeight * 0.62) {
        terminal.catchUp(heading.dataset.scene ?? "");
      }
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true, signal });
  window.addEventListener("resize", relayout, on);

  /* ---------- start ---------- */
  const terminal = makeTerminal({
    root: vault,
    strings,
    graph,
    lanes,
    noteIds,
    titleOf,
    isTask: (id) => TASK_NOTES.includes(id),
    go,
    openSheet: toggleTerminal,
    signal,
  });

  // The pane opens and closes from several places; its toggles say so from one.
  const termToggles = all('[data-action="term-toggle"]', terminal.pane);
  const paintTermToggles = () => {
    const open = String("open" in terminal.pane.dataset);
    for (const button of termToggles) button.setAttribute("aria-expanded", open);
  };
  const paneWatch = new MutationObserver(paintTermToggles);
  paneWatch.observe(terminal.pane, { attributes: true, attributeFilter: ["data-open"] });
  signal.addEventListener("abort", () => {
    paneWatch.disconnect();
  });

  if (isWide()) terminal.pane.dataset.open = "";
  paintTermToggles();
  setLeft("files");
  setRight("graph");
  const start = location.hash.slice(1) || MAIN_NOTE;
  history.scrollRestoration = "manual";
  history.replaceState({ ...(history.state as object), flowY: 0, flowAt: 0 }, "");
  openTabs.push(MAIN_NOTE);
  apply(start);
  jumpTo(0);
  terminal.start();
  graph.start();
  void document.fonts.ready.then(() => {
    if (signal.aborted) return;
    lanes.draw();
    compare.refresh();
    paintThumb();
  });
  signal.addEventListener("abort", () => {
    history.scrollRestoration = "auto";
    hideTip();
    hidePreview();
  });
}
