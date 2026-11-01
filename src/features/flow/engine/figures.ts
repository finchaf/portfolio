import { all, find, isStill } from "./dom";

const NS = "http://www.w3.org/2000/svg";

/** The line through the map of a task: a path from node to node, and a pen over it. */
export function makeLanes(root: HTMLElement) {
  let reached = -1;

  function draw() {
    const box = root.querySelector<HTMLElement>("[data-lanes] ol");
    if (!box || box.offsetWidth === 0) return;
    box.querySelector(".lanes-svg")?.remove();
    const frame = box.getBoundingClientRect();
    const points = all("li", box).map((item) => {
      const node = find(".node", item).getBoundingClientRect();
      return {
        x: node.left + node.width / 2 - frame.left,
        y: node.top + node.height / 2 - frame.top,
      };
    });
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "lanes-svg");
    svg.setAttribute("aria-hidden", "true");
    const base = document.createElementNS(NS, "path");
    base.setAttribute("class", "base");
    let whole = "";
    const segments: string[] = [];
    points.forEach((point, index) => {
      if (index === 0) {
        whole = `M${String(point.x)} ${String(point.y)}`;
        return;
      }
      const from = points[index - 1] ?? point;
      const middle = (from.y + point.y) / 2;
      const curve = `C${String(from.x)} ${String(middle)} ${String(point.x)} ${String(middle)} ${String(point.x)} ${String(point.y)}`;
      whole += curve;
      segments.push(`M${String(from.x)} ${String(from.y)}${curve}`);
    });
    base.setAttribute("d", whole);
    svg.appendChild(base);
    segments.forEach((segment, index) => {
      const pen = document.createElementNS(NS, "path");
      pen.setAttribute("class", "pen");
      pen.setAttribute("d", segment);
      pen.setAttribute("pathLength", "1");
      pen.dataset.seg = String(index);
      if (index < reached) pen.dataset.on = "";
      svg.appendChild(pen);
    });
    box.prepend(svg);
  }

  function reach(step: number) {
    if (step <= reached) return;
    reached = step;
    for (const item of all("[data-lanes] li", root)) {
      const index = Number(item.dataset.step);
      if (index < step) {
        item.dataset.past = "";
        item.removeAttribute("data-now");
      } else if (index === step) {
        item.dataset.now = "";
        item.dataset.past = "";
      }
    }
    for (const pen of all<SVGPathElement>(".lanes-svg .pen", root)) {
      if (Number(pen.dataset.seg) < step) pen.dataset.on = "";
    }
  }

  return { draw, reach, reached: () => reached };
}

const NARROW = "(max-width: 39.99rem)";

/** A wireframe becoming a screen: one line across the row, clipping each screen where it stands. */
export function setupCompare(root: HTMLElement, signal: AbortSignal) {
  const figures = all("[data-compare]", root);

  function cut(figure: HTMLElement, value: number) {
    figure.dataset.cut = String(value);
    const row = find(".compare-row", figure);
    const range = figure.querySelector<HTMLInputElement>("input[type=range]");
    if (range) range.value = String(value);
    for (const button of all("button[data-cut]", figure)) {
      button.setAttribute("aria-pressed", String(value >= 50 === (button.dataset.cut === "100")));
    }
    const frames = all(".device .frame", figure);
    if (matchMedia(NARROW).matches || row.offsetWidth === 0) {
      for (const frame of frames) frame.style.setProperty("--cx", value >= 50 ? "100%" : "0%");
      return;
    }
    const box = row.getBoundingClientRect();
    const x = box.left + (box.width * value) / 100;
    figure.style.setProperty("--line-x", `${String(value)}%`);
    for (const frame of frames) {
      const own = frame.getBoundingClientRect();
      frame.style.setProperty(
        "--cx",
        `${String(Math.max(0, Math.min(own.width, x - own.left)))}px`,
      );
    }
  }

  for (const figure of figures) {
    const row = find(".compare-row", figure);
    const range = figure.querySelector<HTMLInputElement>("input[type=range]");
    range?.addEventListener(
      "input",
      () => {
        cut(figure, Number(range.value));
      },
      { signal },
    );
    figure.addEventListener(
      "click",
      (event) => {
        const button = (event.target as Element).closest<HTMLElement>("button[data-cut]");
        if (button) cut(figure, Number(button.dataset.cut));
      },
      { signal },
    );
    let dragging = false;
    const follow = (event: PointerEvent) => {
      const box = row.getBoundingClientRect();
      const share = ((event.clientX - box.left) / box.width) * 100;
      cut(figure, Math.round(Math.max(0, Math.min(100, share))));
    };
    row.addEventListener(
      "pointerdown",
      (event) => {
        if (event.pointerType === "touch" || matchMedia(NARROW).matches) return;
        dragging = true;
        row.setPointerCapture(event.pointerId);
        follow(event);
      },
      { signal },
    );
    row.addEventListener(
      "pointermove",
      (event) => {
        if (dragging) follow(event);
      },
      { signal },
    );
    row.addEventListener("pointerup", () => (dragging = false), { signal });
  }

  return {
    refresh() {
      for (const figure of figures) cut(figure, Number(figure.dataset.cut ?? 62));
    },
  };
}

/** The history of one rule steps on by itself once, when it comes into view. */
export function setupLadder(root: HTMLElement, signal: AbortSignal) {
  const STEP = 2600;
  const LAST = 4;
  for (const figure of all("[data-ladder]", root)) {
    let timer = 0;
    const show = (rung: number) => {
      figure.dataset.rung = String(rung);
      for (const button of all("button[data-rung-to]", figure)) {
        button.setAttribute("aria-pressed", String(Number(button.dataset.rungTo) === rung));
      }
    };
    figure.addEventListener(
      "click",
      (event) => {
        const button = (event.target as Element).closest<HTMLElement>("button[data-rung-to]");
        if (!button) return;
        clearInterval(timer);
        show(Number(button.dataset.rungTo));
      },
      { signal },
    );
    if (isStill()) {
      show(LAST);
      continue;
    }
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        seen.disconnect();
        timer = window.setInterval(() => {
          const next = Number(figure.dataset.rung) + 1;
          if (next > LAST) clearInterval(timer);
          else show(next);
        }, STEP);
      },
      { threshold: 0.55 },
    );
    seen.observe(figure);
    signal.addEventListener("abort", () => {
      seen.disconnect();
      clearInterval(timer);
    });
  }
}
