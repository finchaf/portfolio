/** The stops of the Projects chapter: the whole board, then each project and one frame of it. */
export const DESK_STOPS = ["board", "portfolio", "themes", "latex", "wall"] as const;

export const LAST_DESK_STOP = DESK_STOPS.length - 1;

/** The tick of the status line each stop belongs to, and the stop each tick goes to. */
export const TICK_OF = [0, 1, 1, 2, 2] as const;
export const STOP_OF_TICK = [0, 1, 3] as const;

/** How long the camera rests on each stop, as a share of the flight between two stops. */
const RESTS = [0.5, 0.8, 0.7, 0.8, 0.9] as const;

const total = RESTS.reduce<number>((sum, rest) => sum + rest, 0) + LAST_DESK_STOP;

export interface DeskMoment {
  /** The stop the camera rests on or is leaving. */
  stop: number;
  /** How far the flight to the next stop has gone, 0 at rest. */
  move: number;
  /** How far the rest has gone, 0 in flight. */
  rest: number;
}

/** Where a scroll of 0 to 1 stands: rests and flights take turns. */
export function deskMomentAt(progress: number): DeskMoment {
  let left = Math.min(Math.max(progress, 0), 1) * total;
  for (let stop = 0; stop <= LAST_DESK_STOP; stop += 1) {
    const rest = RESTS[stop] as number;
    if (left < rest) return { stop, move: 0, rest: left / rest };
    left -= rest;
    if (stop === LAST_DESK_STOP) break;
    if (left < 1) return { stop, move: left, rest: 0 };
    left -= 1;
  }
  return { stop: LAST_DESK_STOP, move: 0, rest: 1 };
}

/** The share of the scroll at which a reader has settled on a stop. */
export function deskProgressOf(stop: number) {
  let at = 0;
  for (let index = 0; index < stop; index += 1) at += (RESTS[index] as number) + 1;
  return (at + (RESTS[stop] as number) * 0.3) / total;
}
