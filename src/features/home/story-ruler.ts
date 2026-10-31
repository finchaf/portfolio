/** Pixels between two ticks. */
const STEP = 10;

/** The three sizes of tick, as on a real ruler: heights in pixels, and how strongly each is drawn. */
const MINOR = { height: 8, alpha: 0.4 };
const MIDDLE = { height: 20, alpha: 0.65 };
const MAJOR = { height: 32, alpha: 1 };

/** How far from the needle a tick feels it, and how fast that fades, in pixels. */
const REACH = 46;
const SPREAD = 26;

/** How much a tick under the needle grows: a fixed part, and a part of its own height. */
const LIFT = 14;
const LIFT_OF_HEIGHT = 0.2;

/** A tick under the needle takes the accent well before the lens has lifted it fully. */
const ACCENT_GAIN = 1.6;

/** The height of the ruler these sizes are drawn for: a shorter one, on a phone, lifts less. */
const FULL_HEIGHT = 92;

/** The share of the ruler's height the needle hangs down, and the size of its head. */
const NEEDLE = 0.65;
const HEAD = 7;

const PIXEL_RATIO_LIMIT = 2;

export function tickKind(index: number) {
  if (index % 10 === 0) return MAJOR;
  return index % 5 === 0 ? MIDDLE : MINOR;
}

/** How strongly the needle acts on a tick this far away: 1 under it, 0 out of reach. */
export function lensAt(distance: number) {
  return Math.abs(distance) > REACH ? 0 : Math.exp(-((distance / SPREAD) ** 2));
}

interface Tone {
  tick: string;
  accent: string;
}

function toneOf(element: Element): Tone {
  const style = getComputedStyle(element);
  return { tick: style.color, accent: style.outlineColor };
}

export interface Ruler {
  /** Reads the sizes and colours again: after a resize or a change of mode. */
  measure: () => void;
  /** Draws the ruler moved by `offset` pixels; a `gain` above 1 lifts the lens further. */
  draw: (offset: number, gain: number) => void;
}

/**
 * The ruler of the story. The ticks slide under a needle that stays put, and the ones passing it
 * grow and take the accent, so the lens is in the ticks themselves. It is a canvas because a hundred
 * and more bars change height on every frame of the scroll. Over `bands`, the parts of the ribbon in
 * other colours, a tick takes the colours of the band.
 */
export function createRuler(
  canvas: HTMLCanvasElement,
  marks: HTMLElement,
  bands: Element[],
): Ruler | null {
  const context = canvas.getContext("2d");
  if (!context) return null;
  const pen = context;
  let width = 0;
  let height = 0;
  let needle = 0;
  let plain: Tone = { tick: "", accent: "" };
  let tones: { band: Element; tone: Tone }[] = [];
  let markColor = "";

  const measure = () => {
    const ratio = Math.min(window.devicePixelRatio, PIXEL_RATIO_LIMIT);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    pen.setTransform(ratio, 0, 0, ratio, 0, 0);
    needle = marks.offsetLeft;
    plain = toneOf(canvas);
    tones = bands.map((band) => ({ band, tone: toneOf(band) }));
  };

  const draw = (offset: number, gain: number) => {
    const reach = (height / FULL_HEIGHT) * gain;
    const places = tones.map(({ band, tone }) => ({ box: band.getBoundingClientRect(), tone }));
    const toneAt = (x: number) =>
      places.find(({ box }) => x >= box.left && x < box.right && box.top <= 0 && box.bottom > 0)
        ?.tone ?? plain;

    pen.clearRect(0, 0, width, height);
    const first = Math.floor(offset / STEP);
    for (let index = first; (index - first) * STEP <= width + STEP; index += 1) {
      const x = Math.round(index * STEP - offset);
      const kind = tickKind(index);
      const lens = lensAt(x - needle);
      const length = kind.height + lens * reach * (LIFT + kind.height * LIFT_OF_HEIGHT);
      const accent = Math.min(lens * ACCENT_GAIN, 1);
      const tone = toneAt(x);
      if (accent < 1) {
        pen.globalAlpha = kind.alpha * (1 - accent);
        pen.fillStyle = tone.tick;
        pen.fillRect(x, 0, 1, length);
      }
      if (accent > 0) {
        pen.globalAlpha = accent;
        pen.fillStyle = tone.accent;
        pen.fillRect(x, 0, 1, length);
      }
    }

    const { accent } = toneAt(needle);
    pen.globalAlpha = 1;
    pen.fillStyle = accent;
    pen.fillRect(Math.round(needle), 0, 1, height * NEEDLE);
    pen.beginPath();
    pen.moveTo(needle - HEAD, 0);
    pen.lineTo(needle + HEAD + 1, 0);
    pen.lineTo(needle + 0.5, HEAD + 2);
    pen.fill();
    if (accent !== markColor) {
      markColor = accent;
      marks.style.setProperty("--mark", accent);
    }
  };

  return { measure, draw };
}
