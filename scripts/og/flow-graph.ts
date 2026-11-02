// The graph of the Flow page for its link picture: the same notes, links and 16 checklists, under the
// same forces from the same seed. The page lays them out in the browser; a picture needs the result.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { MAIN_NOTE, NOTE_IDS, TASK_NOTES } from "../../src/features/flow/notes.ts";
import { CHECKLISTS, relax, type Body, type BodyKind } from "../../src/lib/base-graph.ts";

interface Node extends Body {
  id: string;
}

export interface Drawn {
  id: string;
  kind: BodyKind;
  x: number;
  y: number;
}

function layout() {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const nodes = new Map<string, Node>();
  const add = (id: string, kind: BodyKind) => {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 0.9;
    const node = {
      id,
      kind,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
    };
    nodes.set(id, node);
    return node;
  };
  const links: { a: Node; b: Node }[] = [];
  const join = (a: Node | undefined, b: Node | undefined) => {
    if (a && b && a !== b) links.push({ a, b });
  };

  for (const id of NOTE_IDS) add(id, "note");
  const joined = new Set<string>();
  for (const id of NOTE_IDS) {
    const path = fileURLToPath(new URL(`../../messages/ru/vault/${id}.md`, import.meta.url));
    for (const [, target = ""] of readFileSync(path, "utf8").matchAll(/\[\[([\w-]+)/g)) {
      const key = [id, target].sort().join("|");
      if (joined.has(key)) continue;
      joined.add(key);
      join(nodes.get(id), nodes.get(target));
    }
  }
  for (const id of TASK_NOTES) {
    if (!links.some(({ a, b }) => a.id === id || b.id === id)) {
      join(nodes.get("stage-1"), nodes.get(id));
    }
  }
  for (const [id, rules] of CHECKLISTS) {
    const hub = add(`hub-${id}`, "hub");
    join(hub, nodes.get("checklists"));
    for (let index = 0; index < rules; index += 1) join(add(`${id}-${String(index)}`, "rule"), hub);
  }

  const list = [...nodes.values()];
  for (let alpha = 1; alpha > 0.03; alpha *= 0.992) relax(list, links, alpha);
  const far = Math.max(...list.map(({ x, y }) => Math.max(Math.abs(x), Math.abs(y))));
  return { list, links, far };
}

const circle = (x: number, y: number, r: number) =>
  `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${String(r)}"/>`;

/**
 * What the graph is made of, for the hash of the cards. Not its coordinates: hundreds of steps of the
 * forces end apart on arm64 and x64, and CI would call a fresh picture stale.
 */
export function flowGraphSource() {
  const { list, links } = layout();
  return JSON.stringify([
    list.map(({ id, kind }) => [id, kind]),
    links.map(({ a, b }) => [a.id, b.id]),
  ]);
}

let drawn = "";

/** The graph as SVG, in the part of the picture's right dock that the picture shows. */
export function flowGraph() {
  if (drawn) return drawn;
  const { list, links, far } = layout();
  const size = 122;
  const at = ({ x, y }: Body) => ({ x: 134 + (x / far) * size, y: 236 + (y / far) * size });
  const lines = links
    .map(({ a, b }) => {
      const from = at(a);
      const to = at(b);
      return `M${from.x.toFixed(1)} ${from.y.toFixed(1)}L${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
    })
    .join("");
  const dots = (test: (node: Node) => boolean, radius: number) =>
    list
      .filter(test)
      .map((node) => {
        const { x, y } = at(node);
        return circle(x, y, radius);
      })
      .join("");
  drawn = `<svg class="graph" viewBox="0 0 340 508" aria-hidden="true">
<path class="graph-line" d="${lines}"/>
<g class="graph-rule">${dots(({ kind }) => kind === "rule", 1.5)}</g>
<g class="graph-hub">${dots(({ kind, id }) => kind !== "rule" && id !== MAIN_NOTE, 2.5)}</g>
<g class="graph-now">${dots(({ id }) => id === MAIN_NOTE, 5)}</g>
</svg>`;
  return drawn;
}
