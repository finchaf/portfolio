import { isStill } from "./dom";

/**
 * The graph of the base, drawn on canvas: the notes, the 16 checklists and every one of the 234
 * rules as a dot on its checklist. The counts are the real ones, as of 01.11.2026.
 */
export const CHECKLISTS = [
  ["store", 38],
  ["visual", 26],
  ["figma", 17],
  ["lists", 17],
  ["onboarding", 17],
  ["copy", 14],
  ["paywall", 14],
  ["scope", 13],
  ["generation", 13],
  ["layout", 11],
  ["states", 11],
  ["navigation", 10],
  ["media", 10],
  ["sheets", 9],
  ["chat", 8],
  ["icon", 6],
] as const;

type Kind = "note" | "hub" | "rule";

interface Node {
  id: string;
  kind: Kind;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  degree: number;
  on: boolean;
}

interface Link {
  a: Node;
  b: Node;
}

interface View {
  canvas: HTMLCanvasElement;
  full: boolean;
  width: number;
  height: number;
  scale: number;
  cx: number;
  cy: number;
}

interface Palette {
  dot: string;
  line: string;
  accent: string;
  text: string;
  hub: string;
}

export interface GraphInput {
  notes: { id: string; label: string; hidden: boolean }[];
  links: [string, string][];
  hubLabel: (id: string) => string;
  open: (id: string) => void;
  signal: AbortSignal;
}

export function makeGraph({ notes, links, hubLabel, open, signal }: GraphInput) {
  const nodes: Node[] = [];
  const byId = new Map<string, Node>();
  const edges: Link[] = [];
  // Seeded, so the graph lies the same way for every reader.
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const add = (id: string, kind: Kind, label: string, on = true) => {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 0.9;
    const node: Node = {
      id,
      kind,
      label,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      degree: 0,
      on,
    };
    nodes.push(node);
    byId.set(id, node);
    return node;
  };
  const join = (a: Node | undefined, b: Node | undefined) => {
    if (!a || !b) return;
    edges.push({ a, b });
    a.degree += 1;
    b.degree += 1;
  };

  notes.forEach((note) => add(note.id, "note", note.label, !note.hidden));
  links.forEach(([a, b]) => {
    join(byId.get(a), byId.get(b));
  });
  CHECKLISTS.forEach(([id, rules]) => {
    const hub = add(`hub-${id}`, "hub", hubLabel(id));
    join(hub, byId.get("checklists"));
    for (let index = 0; index < rules; index += 1)
      join(add(`${id}-${String(index)}`, "rule", ""), hub);
  });

  const live = () => nodes.filter((node) => node.on);
  const liveEdges = () => edges.filter(({ a, b }) => a.on && b.on);

  let alpha = 1;
  function tick() {
    const list = live();
    for (let i = 0; i < list.length; i += 1) {
      const a = list[i] as Node;
      a.vx -= a.x * 0.034 * alpha;
      a.vy -= a.y * 0.034 * alpha;
      for (let j = i + 1; j < list.length; j += 1) {
        const b = list[j] as Node;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = dx * dx + dy * dy + 0.0004;
        if (distance > 0.3) continue;
        const notes = a.kind === "note" && b.kind === "note" ? 5 : 1;
        const force = (0.00058 * notes * alpha) / distance;
        a.vx += dx * force;
        a.vy += dy * force;
        b.vx -= dx * force;
        b.vy -= dy * force;
      }
    }
    for (const { a, b } of liveEdges()) {
      const leaf = a.kind === "rule" || b.kind === "rule";
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const force = ((distance - (leaf ? 0.12 : 0.26)) * (leaf ? 0.05 : 0.02) * alpha) / distance;
      a.vx += dx * force;
      a.vy += dy * force;
      b.vx -= dx * force;
      b.vy -= dy * force;
    }
    for (const node of list) {
      if (node === dragged) {
        node.vx = 0;
        node.vy = 0;
        continue;
      }
      node.vx *= 0.7;
      node.vy *= 0.7;
      node.x += node.vx;
      node.y += node.vy;
    }
    alpha *= 0.992;
  }

  const views: View[] = [];
  let current = "";
  let hovered: Node | null = null;
  let dragged: Node | null = null;
  let labels = false;
  let reveal = 1;
  let palette: Palette = {
    dot: "#888",
    line: "#444",
    accent: "#8a5cf5",
    text: "#888",
    hub: "#888",
  };
  const pulses: { node: Node; start: number }[] = [];

  function readPalette() {
    const style = getComputedStyle(document.documentElement);
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    const mode = document.documentElement.dataset.theme ?? (dark ? "dark" : "light");
    const pair = (name: string) => style.getPropertyValue(name).trim();
    const isDark = mode === "dark";
    const mix = isDark ? "255,255,255" : "0,0,0";
    palette = {
      dot: `rgba(${mix},${isDark ? "0.42" : "0.5"})`,
      hub: `rgba(${mix},${isDark ? "0.6" : "0.66"})`,
      line: `rgba(${mix},${isDark ? "0.1" : "0.1"})`,
      accent: pair("--flow-graph-accent") || "#8a5cf5",
      text: `rgba(${mix},0.72)`,
    };
  }

  function fit(view: View) {
    const box = view.canvas.getBoundingClientRect();
    if (box.width === 0) return false;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (view.width !== box.width || view.height !== box.height) {
      view.width = box.width;
      view.height = box.height;
      view.canvas.width = box.width * ratio;
      view.canvas.height = box.height * ratio;
    }
    const list = live();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const { x, y } of list) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const pad = view.full ? 48 : 14;
    view.scale = Math.min(
      (box.width - pad * 2) / Math.max(0.01, maxX - minX),
      (box.height - pad * 2) / Math.max(0.01, maxY - minY),
    );
    view.cx = (minX + maxX) / 2;
    view.cy = (minY + maxY) / 2;
    const context = view.canvas.getContext("2d");
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    return true;
  }

  const px = (view: View, node: Node) => ({
    x: view.width / 2 + (node.x - view.cx) * view.scale,
    y: view.height / 2 + (node.y - view.cy) * view.scale,
  });
  const radius = (view: View, node: Node) => {
    const unit = view.full ? 1.2 : 1;
    if (node.kind === "rule") return 1.25 * unit;
    if (node.kind === "hub") return 2 * unit;
    return (2.2 + Math.min(Math.sqrt(node.degree) * 0.3, 1.6)) * unit;
  };

  function neighbours(node: Node) {
    const near = new Set<Node>([node]);
    for (const { a, b } of edges) {
      if (a === node) near.add(b);
      if (b === node) near.add(a);
    }
    return near;
  }

  function draw(now: number) {
    for (const view of views) {
      if (!fit(view)) continue;
      const context = view.canvas.getContext("2d");
      if (!context) continue;
      context.clearRect(0, 0, view.width, view.height);
      const near = hovered ? neighbours(hovered) : null;
      const shown = Math.floor(nodes.length * reveal);
      const visible = (node: Node) => nodes.indexOf(node) < shown;

      context.lineWidth = 1;
      for (const { a, b } of liveEdges()) {
        if (reveal < 1 && !(visible(a) && visible(b))) continue;
        const hot = hovered && (a === hovered || b === hovered);
        context.strokeStyle = hot ? palette.accent : palette.line;
        context.globalAlpha = near && !hot ? 0.35 : 1;
        const from = px(view, a);
        const to = px(view, b);
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
      }
      for (const node of nodes) {
        if (!node.on || (reveal < 1 && !visible(node))) continue;
        const at = px(view, node);
        const me = node.id === current;
        context.globalAlpha = near && !near.has(node) ? 0.3 : 1;
        context.fillStyle =
          me || node === hovered
            ? palette.accent
            : node.kind === "rule"
              ? palette.dot
              : palette.hub;
        context.beginPath();
        context.arc(at.x, at.y, radius(view, node) + (me ? 1 : 0), 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      context.textAlign = "center";
      context.font = `${view.full ? "13" : "11"}px ${getComputedStyle(document.body).fontFamily}`;
      for (const node of nodes) {
        if (!node.on || node.kind === "rule" || !node.label) continue;
        const named =
          node.id === current ||
          node === hovered ||
          (near?.has(node) ?? false) ||
          labels ||
          (view.full && node.kind === "note");
        if (!named) continue;
        const at = px(view, node);
        context.fillStyle = palette.text;
        context.fillText(node.label, at.x, at.y + radius(view, node) + (view.full ? 16 : 13));
      }
      for (const pulse of pulses) {
        const age = (now - pulse.start) / 900;
        if (age > 1 || !pulse.node.on) continue;
        const at = px(view, pulse.node);
        context.globalAlpha = 1 - age;
        context.strokeStyle = palette.accent;
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(at.x, at.y, 3 + age * 16, 0, Math.PI * 2);
        context.stroke();
      }
      context.globalAlpha = 1;
    }
  }

  let frame = 0;
  function loop(now: number) {
    frame = 0;
    if (signal.aborted) return;
    const end = performance.now() + 9;
    if (alpha > 0.03) {
      do tick();
      while (performance.now() < end && alpha > 0.03);
    }
    for (let index = pulses.length - 1; index >= 0; index -= 1) {
      if (now - (pulses[index]?.start ?? 0) > 900) pulses.splice(index, 1);
    }
    draw(now);
    if (alpha > 0.03 || pulses.length > 0 || reveal < 1) wake();
  }
  function wake() {
    if (!frame) frame = requestAnimationFrame(loop);
  }

  function settle(power: number) {
    alpha = Math.max(alpha, power);
    if (isStill()) {
      while (alpha > 0.03) tick();
      draw(performance.now());
      return;
    }
    wake();
  }

  function attach(canvas: HTMLCanvasElement, full: boolean) {
    const view: View = { canvas, full, width: 0, height: 0, scale: 1, cx: 0, cy: 0 };
    views.push(view);
    const pick = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      let best: Node | null = null;
      let distance = 12;
      for (const node of live()) {
        const at = px(view, node);
        const away = Math.hypot(at.x - x, at.y - y) - (node.kind === "rule" ? 2 : 0);
        if (away < distance) {
          best = node;
          distance = away;
        }
      }
      return best;
    };
    let moved = false;
    canvas.addEventListener(
      "pointermove",
      (event) => {
        if (dragged) {
          moved = true;
          const box = canvas.getBoundingClientRect();
          dragged.x = view.cx + (event.clientX - box.left - view.width / 2) / view.scale;
          dragged.y = view.cy + (event.clientY - box.top - view.height / 2) / view.scale;
          settle(0.25);
          return;
        }
        const next = pick(event);
        if (next !== hovered) {
          hovered = next;
          canvas.style.setProperty("--graph-over", next ? "1" : "0");
          wake();
        }
      },
      { signal },
    );
    canvas.addEventListener(
      "pointerleave",
      () => {
        if (!dragged) {
          hovered = null;
          wake();
        }
      },
      { signal },
    );
    canvas.addEventListener(
      "pointerdown",
      (event) => {
        const node = pick(event);
        if (!node) return;
        dragged = node;
        moved = false;
        canvas.setPointerCapture(event.pointerId);
        event.preventDefault();
      },
      { signal },
    );
    canvas.addEventListener(
      "pointerup",
      () => {
        const node = dragged;
        dragged = null;
        if (node && !moved && node.kind === "note") open(node.id);
        else if (node && !moved && node.kind === "hub") open("checklists");
      },
      { signal },
    );
  }

  readPalette();
  const refreshPalette = () => {
    readPalette();
    wake();
  };
  const themeWatch = new MutationObserver(refreshPalette);
  themeWatch.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", refreshPalette, { signal });
  signal.addEventListener("abort", () => {
    themeWatch.disconnect();
    if (frame) cancelAnimationFrame(frame);
  });

  return {
    attach,
    start() {
      settle(1);
    },
    refresh: wake,
    setCurrent(id: string) {
      current = id;
      wake();
    },
    show(id: string) {
      const node = byId.get(id);
      if (!node || node.on) return;
      node.on = true;
      node.x = (random() - 0.5) * 0.2;
      node.y = (random() - 0.5) * 0.2;
      settle(0.3);
    },
    pulse(id: string) {
      const node = byId.get(id);
      if (!node || isStill()) return;
      pulses.push({ node, start: performance.now() });
      wake();
    },
    toggleLabels() {
      labels = !labels;
      wake();
    },
    /** The app's wand: the graph grows in the order the base grew. */
    animate() {
      if (isStill()) return;
      const start = performance.now();
      const grow = (now: number) => {
        reveal = Math.min(1, (now - start) / 2400);
        draw(now);
        if (reveal < 1 && !signal.aborted) requestAnimationFrame(grow);
      };
      requestAnimationFrame(grow);
    },
  };
}

export type Graph = ReturnType<typeof makeGraph>;
