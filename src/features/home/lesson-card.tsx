export const RADII = [8, 16, 24] as const;
export const DENSITIES = ["compact", "regular"] as const;
export const TONES = ["accent", "success", "warning"] as const;

export type Radius = (typeof RADII)[number];
export type Density = (typeof DENSITIES)[number];
export type Tone = (typeof TONES)[number];

/** A part of the card alone: the scene lays them apart in depth. */
export type Layer = "surface" | "shape" | "text";

export interface LessonCardProps {
  subject: string;
  time: string;
  room: string;
  kind: string;
  teacher: string;
  radius: Radius;
  density: Density;
  tone: Tone;
  layer?: Layer;
}

const TONE_FILL = { accent: "bg-accent", success: "bg-success", warning: "bg-warning" } as const;
const PADDING = { compact: "p-3 gap-3", regular: "p-5 gap-4 lg:p-7 lg:gap-5" } as const;

/**
 * A lesson of a timetable: the component the home page takes apart and hands to the reader. With
 * `layer` it draws only that part, in exactly the same place, so the parts stack into the whole.
 */
export function LessonCard({
  subject,
  time,
  room,
  kind,
  teacher,
  radius,
  density,
  tone,
  layer,
}: LessonCardProps) {
  const shows = (part: Layer) => (!layer || layer === part ? "" : "invisible");
  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto] items-center transition-[padding] duration-(--duration-base) ease-out ${PADDING[density]} ${layer && layer !== "surface" ? "" : "bg-surface ring-1 ring-line"}`}
      style={{ borderRadius: radius }}
    >
      <span className={`h-full min-h-10 w-1.5 rounded-full ${TONE_FILL[tone]} ${shows("shape")}`} />
      <div className="flex min-w-0 flex-col">
        <span
          className={`font-display text-lg leading-tight font-semibold lg:text-2xl ${shows("text")}`}
        >
          {subject}
        </span>
        <span className={`truncate text-sm text-muted ${shows("text")}`}>
          {room} · {teacher}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`font-mono text-sm ${shows("text")}`}>{time}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${!layer || layer === "shape" ? "bg-raised" : ""}`}
        >
          <span className={shows("text")}>{kind}</span>
        </span>
      </div>
    </div>
  );
}
