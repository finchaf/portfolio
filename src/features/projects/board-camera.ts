import { session } from "@/lib/session";
import { FRAMES, SECTION } from "@/ui/board/board-layout";

interface Options {
  open: (href: string) => void;
  /** Milliseconds of a flight. */
  duration: number;
}

/** Set by the way back from a project, to its id: the board opens inside it and pulls out. */
export const RETURN_KEY = "board-return";
/** Set on the way into a project: its page rises in without the slash. */
export const ARRIVE_KEY = "board-arrive";

const MIN = 0.45;
const MAX = 3.2;
/** How far a key moves the camera, in pixels. */
const STEP = 80;
/** How far the board may be pulled past its edge, in pixels of the screen. */
const SLACK = 80;
/** A second press within this many milliseconds is a double press. */
const DOUBLE = 420;
/** Movement of the pointer, in pixels, below which a press is a click. */
const CLICK = 4;

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The camera of the board. It transforms a world that CSS has already fitted to the canvas, so the
 * scale 1 is "everything in view" and no script is needed for the first picture. A selection is
 * marked in attributes: `projects.css` draws it, and the panels hold their words in the HTML.
 */
export function attachBoard(board: HTMLElement, { open, duration }: Options) {
  const pick = (selector: string) => board.querySelector<HTMLElement>(selector);
  const all = (selector: string) => [...board.querySelectorAll<HTMLElement>(selector)];

  const canvas = pick("[data-canvas]");
  const world = pick("[data-camera]");
  const sections = all("[data-sec]");
  const [first] = sections;
  const readout = pick("[data-zoom-value]");
  if (!canvas || !world || !first) return () => undefined;
  const section = first;

  /** A project's section, by its id; the first one for anything else. */
  const sectionOf = (project: string | undefined) =>
    sections.find((each) => each.dataset.sec === project) ?? first;
  /** The project a frame or a layer belongs to. */
  const projectOf = (key: string | null) => {
    if (!key) return current;
    if (sections.some((each) => each.dataset.sec === key)) return key;
    return frameNode(key)?.closest<HTMLElement>("[data-sec]")?.dataset.sec ?? current;
  };
  let current = first.dataset.sec ?? "";

  const camera = { x: 0, y: 0, z: 1 };
  const moved = new Map<string, { x: number; y: number }>();
  const stop = new AbortController();
  const { signal } = stop;
  let flight = 0;

  const paint = () => {
    world.style.transform = `translate(${String(camera.x)}px, ${String(camera.y)}px) scale(${String(camera.z)})`;
    world.style.setProperty("--z", String(camera.z));
    board.style.setProperty("--dot", `${String(1.5 * camera.z)}rem`);
    board.style.setProperty(
      "--dot-x",
      `${String(world.offsetLeft + camera.x)}px ${String(world.offsetTop + camera.y)}px`,
    );
    if (readout) {
      const scale = (section.offsetWidth * camera.z) / SECTION.width;
      readout.textContent = `${String(Math.round(scale * 100))}%`;
    }
  };

  /**
   * Keeps the board on the screen, wherever the camera has been sent. A hand may pull it past its
   * edge by `slack`; the wheel may not, or it would never reach the page's own scroll.
   */
  const hold = (slack = SLACK) => {
    const room = (size: number) => size - size * camera.z;
    const dx = room(world.offsetWidth);
    const dy = room(world.offsetHeight);
    camera.x = clamp(camera.x, Math.min(0, dx) - slack, Math.max(0, dx) + slack);
    camera.y = clamp(camera.y, Math.min(0, dy) - slack, Math.max(0, dy) + slack);
  };

  const fly = (to: { x: number; y: number; z: number }, done?: () => void) => {
    cancelAnimationFrame(flight);
    if (calm()) {
      Object.assign(camera, to);
      paint();
      done?.();
      return;
    }
    const from = { ...camera };
    const start = performance.now();
    world.style.willChange = "transform";
    const step = (now: number) => {
      const t = clamp((now - start) / duration, 0, 1);
      const k = easeInOut(t);
      camera.z = from.z * (to.z / from.z) ** k;
      camera.x = from.x + (to.x - from.x) * k;
      camera.y = from.y + (to.y - from.y) * k;
      paint();
      if (t < 1) {
        flight = requestAnimationFrame(step);
      } else {
        world.style.willChange = "";
        done?.();
      }
    };
    flight = requestAnimationFrame(step);
  };

  /** The camera that puts a box of the world, in its own pixels, in the middle of the free space. */
  const framing = (box: { x: number; y: number; w: number; h: number }, room = 0.86) => {
    const canvasBox = canvas.getBoundingClientRect();
    const left = pick(".pj-board-layers")?.getBoundingClientRect().right ?? 0;
    const right =
      pick(".pj-board-inspector[data-current]")?.getBoundingClientRect().left ?? canvasBox.right;
    const top = canvasBox.top + 88;
    const bottom = canvasBox.bottom - 24;
    const z = clamp(
      Math.min(((right - left) * room) / box.w, ((bottom - top) * room) / box.h),
      MIN,
      MAX,
    );
    return {
      z,
      x: (left + right) / 2 - canvasBox.left - world.offsetLeft - (box.x + box.w / 2) * z,
      y: (top + bottom) / 2 - canvasBox.top - world.offsetTop - (box.y + box.h / 2) * z,
    };
  };

  /** A frame's box in the world's pixels, wherever it has been dragged. */
  const boxOf = (node: HTMLElement) => {
    const at = world.getBoundingClientRect();
    const own = node.getBoundingClientRect();
    return {
      x: (own.left - at.left) / camera.z,
      y: (own.top - at.top) / camera.z,
      w: own.width / camera.z,
      h: own.height / camera.z,
    };
  };

  /* What is selected */

  const frameNode = (key: string) => pick(`[data-frame="${key}"]`);

  /** Selects a frame, or a whole project by its id; `null` keeps the project and drops the frame. */
  const select = (key: string | null) => {
    current = projectOf(key);
    const frame = key && key !== current ? frameNode(key) : null;
    all("[data-selected]").forEach((node) => {
      node.removeAttribute("data-selected");
    });
    all("[data-inspect]").forEach((node) => {
      node.hidden = !frame || node.dataset.inspect !== key;
    });
    all(".pj-board-inspector").forEach((panel) => {
      panel.toggleAttribute("data-current", panel.dataset.project === current);
    });
    (frame ?? sectionOf(current)).setAttribute("data-selected", "");
    all("[data-layer]").forEach((row) => {
      if (row.dataset.layer === (frame ? key : current)) row.setAttribute("aria-current", "true");
      else row.removeAttribute("aria-current");
    });
  };

  const hrefOf = (key: string | null) => {
    const frame = key ? frameNode(key) : null;
    return (
      frame?.getAttribute("href") ??
      pick(`.pj-board-inspector[data-project="${current}"] [data-primary-open]`)?.getAttribute(
        "href",
      ) ??
      ""
    );
  };

  /** Into the project: the camera enters the section, then the page takes over with no slash. */
  const enter = (key: string | null) => {
    const href = hrefOf(key);
    board.dataset.leaving = "";
    const box = boxOf(sectionOf(current));
    const canvasBox = canvas.getBoundingClientRect();
    const z = Math.max(canvasBox.width / box.w, canvasBox.height / box.h) * 0.9;
    const go = () => {
      session.set(ARRIVE_KEY, "1");
      document.documentElement.setAttribute("data-page-quiet", "");
      open(href);
    };
    fly(
      {
        z,
        x: canvasBox.width / 2 - world.offsetLeft - (box.x + box.w / 2) * z,
        y: canvasBox.height / 2 - world.offsetTop - (box.y + box.h / 2) * z,
      },
      go,
    );
  };

  /* The pointer */

  let press: {
    x: number;
    y: number;
    cx: number;
    cy: number;
    moved: boolean;
    frame: HTMLElement | null;
    onSection: string | undefined;
    base: { x: number; y: number };
  } | null = null;
  let last = { at: 0, target: "" };
  const fingers = new Map<number, { x: number; y: number }>();
  let pinch = 0;

  const toLocal = () => SECTION.width / section.offsetWidth;

  const readAxes = (frame: HTMLElement) => {
    const key = frame.dataset.frame ?? "";
    const data = FRAMES.find((each) => each.key === key);
    const shift = moved.get(key) ?? { x: 0, y: 0 };
    const block = pick(`[data-inspect="${key}"]`);
    if (!data || !block) return;
    const write = (axis: string, value: number) => {
      const cell = block.querySelector(`[data-axis="${axis}"]`);
      if (cell) cell.textContent = String(Math.round(value));
    };
    write("x", data.x + shift.x * toLocal());
    write("y", data.y + shift.y * toLocal());
  };

  canvas.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button) return;
      fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (fingers.size > 1) {
        press = null;
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      const frame = target?.closest<HTMLElement>("[data-frame]") ?? null;
      const key = frame?.dataset.frame ?? "";
      press = {
        x: event.clientX,
        y: event.clientY,
        cx: camera.x,
        cy: camera.y,
        moved: false,
        frame,
        onSection: target?.closest<HTMLElement>("[data-sec]")?.dataset.sec,
        base: moved.get(key) ?? { x: 0, y: 0 },
      };
      canvas.setPointerCapture(event.pointerId);
    },
    { signal },
  );

  canvas.addEventListener(
    "pointermove",
    (event) => {
      if (fingers.has(event.pointerId)) {
        fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }
      if (fingers.size === 2) {
        const [a, b] = [...fingers.values()];
        if (!a || !b) return;
        const span = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) zoomAt(span / pinch, (a.x + b.x) / 2, (a.y + b.y) / 2);
        pinch = span;
        return;
      }
      if (!press) return;
      const dx = event.clientX - press.x;
      const dy = event.clientY - press.y;
      if (!press.moved && Math.hypot(dx, dy) < CLICK) return;
      press.moved = true;
      if (press.frame) {
        const key = press.frame.dataset.frame ?? "";
        const shift = { x: press.base.x + dx / camera.z, y: press.base.y + dy / camera.z };
        moved.set(key, shift);
        press.frame.style.translate = `${String(shift.x)}px ${String(shift.y)}px`;
        select(key);
        readAxes(press.frame);
      } else {
        camera.x = press.cx + dx;
        camera.y = press.cy + dy;
        hold();
        paint();
      }
    },
    { signal },
  );

  const release = (event: PointerEvent) => {
    fingers.delete(event.pointerId);
    pinch = 0;
    const was = press;
    press = null;
    if (!was || was.moved || event.type !== "pointerup") return;
    const key = was.frame?.dataset.frame ?? was.onSection ?? null;
    if (!key) return;
    select(key);
    const target = key;
    if (last.target === target && event.timeStamp - last.at < DOUBLE) enter(was.frame ? key : null);
    last = { at: event.timeStamp, target };
  };
  canvas.addEventListener("pointerup", release, { signal });
  canvas.addEventListener("pointercancel", release, { signal });

  // A frame is a link, and Gecko starts the native drag of a link, which cancels the pointer.
  canvas.addEventListener(
    "dragstart",
    (event) => {
      event.preventDefault();
    },
    { signal },
  );

  // The capture makes the canvas every click's target, so a frame's link never follows a mouse. A
  // key's click has no pointer behind it, and that one the link keeps.
  canvas.addEventListener(
    "click",
    (event) => {
      if (event.detail > 0) event.preventDefault();
    },
    { capture: true, signal },
  );

  function zoomAt(ratio: number, screenX: number, screenY: number) {
    const box = canvas?.getBoundingClientRect();
    if (!box || !world) return;
    const px = screenX - box.left - world.offsetLeft;
    const py = screenY - box.top - world.offsetTop;
    const z = clamp(camera.z * ratio, MIN, MAX);
    camera.x = px - ((px - camera.x) * z) / camera.z;
    camera.y = py - ((py - camera.y) * z) / camera.z;
    camera.z = z;
    hold();
    paint();
  }

  // The wheel pans, and at the lower edge of the board it is the page's: the footer stays in reach.
  canvas.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        zoomAt(Math.exp(-event.deltaY * 0.01), event.clientX, event.clientY);
        return;
      }
      if (window.scrollY > 1) return;
      const before = camera.y;
      camera.x -= event.deltaX;
      camera.y -= event.deltaY;
      hold(0);
      const stuck = Math.abs(camera.y - before) < 0.5;
      if (event.deltaY > 0 && stuck && Math.abs(event.deltaX) < Math.abs(event.deltaY)) return;
      event.preventDefault();
      paint();
    },
    { passive: false, signal },
  );

  /* The keys, the panels and the zoom */

  const fit = () => {
    fly({ x: 0, y: 0, z: 1 });
  };

  board.addEventListener(
    "click",
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const zoom = target?.closest<HTMLElement>("[data-zoom]")?.dataset.zoom;
      if (zoom === "all") fit();
      else if (zoom) {
        const box = canvas.getBoundingClientRect();
        zoomAt(zoom === "in" ? 1.25 : 0.8, box.left + box.width / 2, box.top + box.height / 2);
      }
      const layer = target?.closest<HTMLElement>("[data-layer]")?.dataset.layer;
      if (layer) {
        const frame = frameNode(layer);
        select(layer);
        fly(framing(boxOf(frame ?? sectionOf(layer)), frame ? 0.8 : 0.96));
      }
      const opener = target?.closest<HTMLElement>("[data-open]");
      if (opener) {
        event.preventDefault();
        const project = opener.dataset.open;
        if (project && project !== current) select(project);
        enter(null);
      }
    },
    { signal },
  );

  board.addEventListener(
    "pointerover",
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const key = target?.closest<HTMLElement>("[data-layer]")?.dataset.layer;
      all("[data-hover]").forEach((node) => {
        node.removeAttribute("data-hover");
      });
      if (key) (frameNode(key) ?? sectionOf(key)).setAttribute("data-hover", "");
      const frame = target?.closest<HTMLElement>("[data-frame]")?.dataset.frame;
      if (frame) pick(`[data-layer="${frame}"]`)?.setAttribute("data-hover", "");
    },
    { signal },
  );

  board.addEventListener(
    "focusin",
    (event) => {
      const frame = event.target instanceof Element ? event.target.closest("[data-frame]") : null;
      if (frame instanceof HTMLElement && frame.matches(":focus-visible")) {
        select(frame.dataset.frame ?? null);
      }
    },
    { signal },
  );

  board.addEventListener(
    "keydown",
    (event) => {
      const box = canvas.getBoundingClientRect();
      const pans: Record<string, [number, number]> = {
        ArrowLeft: [STEP, 0],
        ArrowRight: [-STEP, 0],
        ArrowUp: [0, STEP],
        ArrowDown: [0, -STEP],
      };
      const pan = pans[event.key];
      if (pan) {
        event.preventDefault();
        camera.x += pan[0];
        camera.y += pan[1];
        hold();
        paint();
      } else if (event.key === "+" || event.key === "=") {
        zoomAt(1.25, box.left + box.width / 2, box.top + box.height / 2);
      } else if (event.key === "-") {
        zoomAt(0.8, box.left + box.width / 2, box.top + box.height / 2);
      } else if (event.key === "0") {
        fit();
      } else if (event.key === "Escape") {
        select(current);
      }
    },
    { signal },
  );

  // The canvas clips the world, yet it is still a box the browser scrolls: a key's focus on a frame
  // past its edge does. That scroll is folded into the camera, so the frame stays where the
  // browser put it and every pan and zoom after it starts from where the board really is.
  canvas.addEventListener(
    "scroll",
    () => {
      const { scrollLeft, scrollTop } = canvas;
      if (!scrollLeft && !scrollTop) return;
      camera.x -= scrollLeft;
      camera.y -= scrollTop;
      canvas.scrollLeft = 0;
      canvas.scrollTop = 0;
      paint();
    },
    { signal },
  );

  const resize = new ResizeObserver(() => {
    paint();
  });
  resize.observe(canvas);

  // Back from a project: the board opens inside it and pulls out.
  const back = session.get(RETURN_KEY);
  select(sections.some((each) => each.dataset.sec === back) ? back : current);
  if (back) {
    session.remove(RETURN_KEY);
    if (!calm()) {
      const box = boxOf(sectionOf(current));
      const size = canvas.getBoundingClientRect();
      const z = Math.max(size.width / box.w, size.height / box.h) * 0.9;
      camera.z = z;
      camera.x = size.width / 2 - world.offsetLeft - (box.x + box.w / 2) * z;
      camera.y = size.height / 2 - world.offsetTop - (box.y + box.h / 2) * z;
      board.dataset.leaving = "";
      paint();
      requestAnimationFrame(() => {
        delete board.dataset.leaving;
        fit();
      });
    }
  }
  paint();

  return () => {
    stop.abort();
    resize.disconnect();
    cancelAnimationFrame(flight);
    world.style.transform = "";
    world.style.willChange = "";
    canvas.scrollLeft = 0;
    canvas.scrollTop = 0;
    world.style.removeProperty("--z");
    all("[data-frame]").forEach((node) => {
      node.style.translate = "";
    });
    delete board.dataset.leaving;
  };
}
