import { ScrollTrigger } from "@/motion/gsap";

/**
 * On a touch screen a flick carries the scroll through a stop and leaves the scene halfway along a
 * move. Each stop's rest gets a mark the browser snaps to, `proximity`: a scroll that ends near a
 * rest settles on it, natively, with the finger's momentum and without a script fighting it. With a
 * mouse or a trackpad the scroll stays the reader's own.
 *
 * `rests` gives the scroll positions of the rests. The scene calls `place` from its trigger's
 * refresh, when those positions are known; `undo` takes the marks away.
 */
export function snapToRests(chapter: HTMLElement, rests: () => number[]) {
  if (ScrollTrigger.isTouch !== 1) return { place: () => undefined, undo: () => undefined };
  const marks: HTMLElement[] = [];

  const place = () => {
    // A mark meets the top of the snapport, which the page's scroll padding moves down.
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const top = chapter.getBoundingClientRect().top + window.scrollY - padding;
    const at = rests();
    while (marks.length < at.length) {
      const mark = document.createElement("i");
      mark.className = "chapter-snap";
      mark.setAttribute("aria-hidden", "true");
      chapter.append(mark);
      marks.push(mark);
    }
    marks.forEach((mark, index) => {
      const scroll = at[index];
      mark.hidden = scroll === undefined;
      if (scroll !== undefined) mark.style.top = `${(scroll - top).toFixed(1)}px`;
    });
  };

  document.documentElement.setAttribute("data-snap", "");
  place();
  return {
    place,
    undo: () => {
      for (const mark of marks) mark.remove();
      if (!document.querySelector(".chapter-snap")) {
        document.documentElement.removeAttribute("data-snap");
      }
    },
  };
}
