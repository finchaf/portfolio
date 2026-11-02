/**
 * The knowledge base of the Flow case, as of 01.11.2026: its 16 checklists with the number of rules
 * in each, and how a graph of it settles. The Flow page and the home page draw the same base.
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

/** Counted over the same checklists, on the same date. */
export const BASE_FIGURES = { rules: 234, scripted: 89, repeated: 24 } as const;

export type BodyKind = "note" | "hub" | "rule";

export interface Body {
  kind: BodyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Tie<T extends Body> {
  a: T;
  b: T;
}

/** One step of the forces: everything falls to the middle, pushes its neighbours, pulls its links. */
export function relax<T extends Body>(
  bodies: readonly T[],
  ties: readonly Tie<T>[],
  alpha: number,
  held: T | null = null,
) {
  for (let i = 0; i < bodies.length; i += 1) {
    const a = bodies[i] as T;
    a.vx -= a.x * 0.034 * alpha;
    a.vy -= a.y * 0.034 * alpha;
    for (let j = i + 1; j < bodies.length; j += 1) {
      const b = bodies[j] as T;
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
  for (const { a, b } of ties) {
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
  for (const body of bodies) {
    if (body === held) {
      body.vx = 0;
      body.vy = 0;
      continue;
    }
    body.vx *= 0.7;
    body.vy *= 0.7;
    body.x += body.vx;
    body.y += body.vy;
  }
}
