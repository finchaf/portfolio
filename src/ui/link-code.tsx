import { create } from "qrcode";

import { SLASH_PATH, SLASH_SIZE } from "@/ui/logo";

/** The empty margin a reader needs around a code, in modules. */
const QUIET = 4;

/** The room the mark takes in the middle, in modules: the highest error correction absorbs it. */
const MARK = 7;

/** A finder's square, its hole and its pupil, rounded a little, at a corner of the code. */
function finder(x: number, y: number) {
  return [
    `M${String(x + 1.2)} ${String(y)}h4.6a1.2 1.2 0 0 1 1.2 1.2v4.6a1.2 1.2 0 0 1-1.2 1.2h-4.6a1.2 1.2 0 0 1-1.2-1.2v-4.6a1.2 1.2 0 0 1 1.2-1.2z`,
    `M${String(x + 1.3)} ${String(y + 1)}a.3 .3 0 0 0-.3 .3v4.4a.3 .3 0 0 0 .3 .3h4.4a.3 .3 0 0 0 .3-.3v-4.4a.3 .3 0 0 0-.3-.3z`,
    `M${String(x + 2.6)} ${String(y + 2)}h1.8a.6 .6 0 0 1 .6 .6v1.8a.6 .6 0 0 1-.6 .6h-1.8a.6 .6 0 0 1-.6-.6v-1.8a.6 .6 0 0 1 .6-.6z`,
  ].join("");
}

/**
 * An address as a code a phone reads, drawn during the build, so the page carries a picture and no
 * library. The finders are rounded a little; `mark` puts the logo's slash in the middle, which the
 * highest error correction absorbs. Without it the code keeps fewer modules and reads from further.
 * It has no look of its own: its place colours `link-code-module` and `link-code-mark`.
 */
export function LinkCode({
  url,
  label,
  className,
  mark = true,
}: {
  url: string;
  label: string;
  className: string;
  mark?: boolean;
}) {
  const { size, data } = create(url, { errorCorrectionLevel: mark ? "H" : "M" }).modules;
  const start = (size - MARK) / 2;
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
  const inMark = (x: number, y: number) =>
    mark && x >= start && x < start + MARK && y >= start && y < start + MARK;

  let modules = "";
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const on = data[y * size + x] === 1;
      if (on && !inFinder(x, y) && !inMark(x, y)) modules += `M${String(x)} ${String(y)}h1v1h-1z`;
    }
  }
  const scale = (MARK - 2) / SLASH_SIZE.height;
  const left = size / 2 - (SLASH_SIZE.width * scale) / 2;
  return (
    <svg
      aria-label={label}
      className={className}
      role="img"
      viewBox={`${String(-QUIET)} ${String(-QUIET)} ${String(size + 2 * QUIET)} ${String(size + 2 * QUIET)}`}
    >
      <path className="link-code-module" d={modules} />
      <path
        className="link-code-mark"
        d={[finder(0, 0), finder(size - 7, 0), finder(0, size - 7)].join("")}
        fillRule="evenodd"
      />
      {mark && (
        <path
          className="link-code-mark"
          d={SLASH_PATH}
          transform={`translate(${String(left)} ${String(start + 1)}) scale(${String(scale)})`}
        />
      )}
    </svg>
  );
}
