/**
 * The share of a stop's rest at which a reader counts as settled on it: a flick ends a third of
 * the way in, and a stop pressed in the bar is reached there too.
 */
export const SETTLE = 0.3;

export interface Moment {
  /** The stop the scene rests on or is leaving. */
  stop: number;
  /** How far the move to the next stop has gone, 0 at rest. */
  move: number;
  /** How far the rest has gone, 0 on the move. */
  rest: number;
}

/**
 * A chapter's scroll as rests and moves taking turns, so nothing fights for the wheel. `rests`
 * holds one length per stop and `moves` one per flight between two, in the same unit of scroll.
 */
export function stopTimeline(rests: readonly number[], moves: readonly number[]) {
  const last = rests.length - 1;
  const total =
    rests.reduce((sum, rest) => sum + rest, 0) + moves.reduce((sum, move) => sum + move, 0);

  /** Where a scroll of 0 to 1 stands. */
  const momentAt = (progress: number): Moment => {
    let left = Math.min(Math.max(progress, 0), 1) * total;
    for (let stop = 0; stop <= last; stop += 1) {
      const rest = rests[stop] as number;
      if (left < rest) return { stop, move: 0, rest: left / rest };
      left -= rest;
      if (stop === last) break;
      const flight = moves[stop] as number;
      if (left < flight) return { stop, move: left / flight, rest: 0 };
      left -= flight;
    }
    return { stop: last, move: 0, rest: 1 };
  };

  /** The share of the scroll at which a reader is settled on a stop. */
  const progressOf = (stop: number) => {
    let at = 0;
    for (let index = 0; index < stop; index += 1) {
      at += (rests[index] as number) + (moves[index] as number);
    }
    return (at + (rests[stop] as number) * SETTLE) / total;
  };

  return { momentAt, progressOf };
}
