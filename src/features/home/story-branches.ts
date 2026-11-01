import { BRANCH_BASELINE, BRANCH_RISE, BRANCHES } from "./story-data";

export type Line = "trunk" | (typeof BRANCHES)[number]["key"];

export interface Route {
  line: Line;
  /** The path, in pixels of the chapter. */
  d: string;
  /** How far along the pen has come when this line starts. */
  from: number;
}

export interface Routes {
  routes: Route[];
  /** Where the lines leave the trunk, by the line that leaves. */
  forks: Record<"open" | "masters", { x: number; y: number }>;
  /** Where the lines that stop, stop. */
  tips: Record<"open" | "masters", { x: number; y: number }>;
}

const [open, masters, next] = BRANCHES;

/**
 * A line leaves the trunk at an angle, so it is never two lines lying on one another for the first
 * pixels of the way, and settles level. The first handle is what sets the angle.
 */
function leave(x: number, base: number, y: number, run: number) {
  const height = base - y;
  return `C ${String(x + run * 0.2)} ${String(base - height * 0.3)}, ${String(x + run * 0.45)} ${String(y)}, ${String(x + run)} ${String(y)}`;
}

/**
 * The lines of the last chapter. One trunk comes in from the left edge and each line leaves it at a
 * fork of its own. The last line is no fork: it is the trunk itself going on, and rises only as far as
 * its own level. A pen moves along them all at one speed, so `from` is a distance along the trunk.
 */
export function branchRoutes(width: number, height: number): Routes {
  const base = height - BRANCH_BASELINE;
  const run = width * BRANCH_RISE;
  const at = (branch: (typeof BRANCHES)[number]) => ({
    x: branch.fork * width,
    y: branch.y * height,
    end: branch.end * width,
  });
  const a = at(open);
  const b = at(masters);
  const c = at(next);
  return {
    routes: [
      { line: "trunk", d: `M 0 ${String(base)} L ${String(b.x)} ${String(base)}`, from: 0 },
      {
        line: "open",
        d: `M ${String(a.x)} ${String(base)} ${leave(a.x, base, a.y, run)} L ${String(a.end)} ${String(a.y)}`,
        from: a.x,
      },
      {
        line: "masters",
        d: `M ${String(b.x)} ${String(base)} ${leave(b.x, base, b.y, run)} L ${String(b.end)} ${String(b.y)}`,
        from: b.x,
      },
      {
        line: "next",
        d: `M ${String(b.x)} ${String(base)} L ${String(c.x)} ${String(base)} C ${String(c.x + run * 0.5)} ${String(base)}, ${String(c.x + run * 0.5)} ${String(c.y)}, ${String(c.x + run)} ${String(c.y)} L ${String(c.end)} ${String(c.y)}`,
        from: b.x,
      },
    ],
    forks: { open: { x: a.x, y: base }, masters: { x: b.x, y: base } },
    tips: { open: { x: a.end, y: a.y }, masters: { x: b.end, y: b.y } },
  };
}
