import { stopTimeline, type Moment } from "./stop-timeline";

/** The stops of the Projects chapter: the whole board, then each project and one frame of it. */
export const DESK_STOPS = ["board", "portfolio", "themes", "latex", "wall"] as const;

export const LAST_DESK_STOP = DESK_STOPS.length - 1;

/** The tick of the status line each stop belongs to, and the stop each tick goes to. */
export const TICK_OF = [0, 1, 1, 2, 2] as const;
export const STOP_OF_TICK = [0, 1, 3] as const;

/** How long the camera rests on each stop, as a share of the flight between two stops. */
const RESTS = [0.5, 0.8, 0.7, 0.8, 0.9] as const;

/** Every flight between two stops takes the same one unit of scroll. */
const FLIGHTS = DESK_STOPS.slice(1).map(() => 1);

/** The camera's stop, flight and rest. */
export type DeskMoment = Moment;

/** Where a scroll of 0 to 1 stands, and the share of the scroll settled on a stop. */
export const { momentAt: deskMomentAt, progressOf: deskProgressOf } = stopTimeline(RESTS, FLIGHTS);
