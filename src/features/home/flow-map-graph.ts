import { CHECKLISTS, relax, type Body, type Tie } from "@/lib/base-graph";

/** The stops of Flow's chapter, each a node of the graph. */
export const STOPS = ["intro", "brief", "research", "screens", "handoff", "rule", "base"] as const;

export const LAST_STOP = STOPS.length - 1;

/**
 * How long the scene rests on each stop and how long each flight to the next one takes, in one
 * unit of scroll (`--length` over their sum). The rule rests longest: its history steps through
 * five rungs. The last flight gathers the strip into the base and the base rests briefly: the
 * chapter hands over to Projects right after.
 */
const RESTS = [0.6, 1, 1, 1.6, 1, 2.4, 0.7] as const;
const MOVES = [1, 1, 1, 1, 1, 0.7] as const;

const total =
  RESTS.reduce<number>((sum, rest) => sum + rest, 0) +
  MOVES.reduce<number>((sum, move) => sum + move, 0);

export interface Moment {
  /** The stop the scene rests on or is leaving. */
  stop: number;
  /** How far the move to the next stop has gone, 0 at rest. */
  move: number;
  /** How far the rest has gone, 0 on the move. */
  rest: number;
}

/** Where a scroll of 0 to 1 stands: rests and moves take turns, so nothing fights for the wheel. */
export function momentAt(progress: number): Moment {
  let left = Math.min(Math.max(progress, 0), 1) * total;
  for (let stop = 0; stop <= LAST_STOP; stop += 1) {
    const rest = RESTS[stop] as number;
    if (left < rest) return { stop, move: 0, rest: left / rest };
    left -= rest;
    if (stop === LAST_STOP) break;
    const flight = MOVES[stop] as number;
    if (left < flight) return { stop, move: left / flight, rest: 0 };
    left -= flight;
  }
  return { stop: LAST_STOP, move: 0, rest: 1 };
}

/** The share of the scroll at which a reader is settled on a stop. */
export function progressOf(stop: number) {
  let at = 0;
  for (let index = 0; index < stop; index += 1) {
    at += (RESTS[index] as number) + (MOVES[index] as number);
  }
  return (at + (RESTS[stop] as number) * 0.3) / total;
}

export interface MapNode extends Body {
  id: string;
  label: string;
  /** The stop this node is, or -1. */
  stop: number;
  hub: MapNode | null;
  rules: number;
  /** 0 to 1 along the line of the stops, with a little beyond each end. */
  along: number;
  /** -1 to 1 across it. */
  high: number;
  /** A rule's place around its hub. */
  dx: number;
  dy: number;
  /** Nearer or further from the camera. */
  depth: number;
  /** When it opens, within its hub's fan. */
  order: number;
  /** On the screen, this frame. */
  sx: number;
  sy: number;
  /** How far it has left the strip for the whole base, this frame. */
  gathered: number;
  /** Whether its fan is open, this frame. */
  open: number;
}

export interface MapLink extends Tie<MapNode> {
  /** Until the base gathers, a checklist hangs on the stop beside it. */
  near: MapNode | null;
}

export interface FlowMap {
  nodes: MapNode[];
  links: MapLink[];
  stops: MapNode[];
  /** The dot whose history the chapter tells. */
  rule: MapNode;
  settled: boolean;
  alpha: number;
}

/** The checklist the chapter stops at: its first rule is the one told in full. */
const TOLD = "sheets";

const HEIGHTS = [0.02, -0.3, 0.28, -0.24, 0.3, -0.1, 0] as const;

/** Big and small checklists take turns along the line, so no stretch of it is empty. */
const ALONG = [4, 11, 1, 7, 13, 2, 9, 14, 0, 6, 12, 3, 10, 5, 8] as const;

/** The base as dots and links, and one fixed way of laying it along a line. Seeded, so it never differs. */
export function buildMap(names: Readonly<Record<string, string>>): FlowMap {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const nodes: MapNode[] = [];
  const links: MapLink[] = [];
  const add = (id: string, kind: MapNode["kind"], label: string, stop = -1) => {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 0.9;
    const node: MapNode = {
      id,
      kind,
      label,
      stop,
      hub: null,
      rules: 0,
      along: 0.5,
      high: 0,
      dx: 0,
      dy: 0,
      depth: 1,
      order: 0,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      sx: 0,
      sy: 0,
      gathered: 0,
      open: 0,
    };
    nodes.push(node);
    return node;
  };
  const join = (a: MapNode, b: MapNode, near: MapNode | null = null) => {
    links.push({ a, b, near });
  };

  const notes = STOPS.slice(0, 5).map((id, stop) => add(id, "note", "", stop));
  const base = add("base", "note", "", LAST_STOP);
  notes.forEach((note, index) => {
    join(note, notes[index + 1] ?? base);
  });
  join(notes[0] as MapNode, base);

  const hubs = new Map<string, MapNode>();
  for (const [id, rules] of CHECKLISTS) {
    const hub = add(`hub-${id}`, "hub", names[id] ?? id, id === TOLD ? 5 : -1);
    hub.rules = rules;
    hubs.set(id, hub);
    join(hub, base);
    for (let index = 0; index < rules; index += 1) {
      const rule = add(`${id}-${String(index)}`, "rule", "");
      rule.hub = hub;
      rule.order = index / Math.max(1, rules - 1);
      join(rule, hub);
    }
  }
  const told = hubs.get(TOLD) as MapNode;
  const stops = [...notes, told, base];

  stops.forEach((node, stop) => {
    node.along = stop / LAST_STOP;
    node.high = HEIGHTS[stop] as number;
  });
  const others = CHECKLISTS.filter(([id]) => id !== TOLD).map(([id]) => hubs.get(id) as MapNode);
  ALONG.forEach((index, place) => {
    const hub = others[index] as MapNode;
    hub.along = -0.03 + ((place + 0.5) / ALONG.length) * 1.06 + (random() - 0.5) * 0.012;
    hub.high = (place % 2 ? 1 : -1) * (0.34 + random() * 0.34);
    hub.depth = 0.86 + random() * 0.34;
    const near = stops[Math.max(0, Math.min(LAST_STOP, Math.round(hub.along * LAST_STOP)))];
    const link = links.find(({ a, b }) => a === hub && b === base);
    if (link && near) link.near = near;
  });
  for (const node of nodes) {
    const { hub } = node;
    if (!hub) continue;
    const index = Number(node.id.split("-").at(-1));
    const angle = index * 2.39996 + random() * 0.4;
    const radius = Math.sqrt((index + 0.6) / hub.rules) * (0.13 + 0.26 * Math.sqrt(hub.rules / 38));
    node.along = hub.along;
    node.high = hub.high;
    node.dx = Math.cos(angle) * radius;
    node.dy = Math.sin(angle) * radius;
    node.depth = hub.depth;
  }

  const rule = nodes.find(({ id }) => id === `${TOLD}-0`) as MapNode;
  return { nodes, links, stops, rule, settled: false, alpha: 1 };
}

/** Lets the base find its round shape, for at most `budget` milliseconds. True once it has. */
export function settleMap(map: FlowMap, budget: number) {
  if (map.settled) return true;
  const end = performance.now() + budget;
  do {
    relax(map.nodes, map.links, map.alpha);
    map.alpha *= 0.992;
  } while (map.alpha > 0.03 && performance.now() < end);
  if (map.alpha > 0.03) return false;
  let far = 0.001;
  for (const { x, y } of map.nodes) far = Math.max(far, Math.abs(x), Math.abs(y));
  for (const node of map.nodes) {
    node.x /= far;
    node.y /= far;
  }
  map.settled = true;
  return true;
}
