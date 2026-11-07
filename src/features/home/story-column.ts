import { gsap, ScrollTrigger } from "@/motion/gsap";

import {
  clearTheScreen,
  countUp,
  CURRENT_AT,
  dealMenus,
  dealScraps,
  type Mark,
  moveLines,
  revealOnce,
  runRuler,
  runScore,
} from "./story-moves";

/** How far the ruler slides over a whole story on a phone, where no ribbon moves, in pixels. */
const RULER_TRAVEL = 2400;

/** On a phone the branches are a list, and the line down it follows the reader. */
function growTrunk(section: HTMLElement) {
  const list = section.querySelector("[data-branch-list]");
  if (!list) return;
  gsap.fromTo(
    list,
    { "--drawn": 0 },
    {
      "--drawn": 1,
      ease: "none",
      scrollTrigger: { trigger: list, start: "top 85%", end: "bottom 60%", scrub: true },
    },
  );
}

/** A phone keeps the page: chapters come up as they arrive, and the ruler counts along. */
export function runColumn(section: HTMLElement, mark: Mark) {
  gsap.utils.toArray<HTMLElement>("[data-reveal]", section).forEach((element) => {
    revealOnce(element, { start: "top 88%" });
  });
  const along = ScrollTrigger.create({ trigger: section, start: "top top", end: "bottom bottom" });
  gsap.utils.toArray<HTMLElement>("[data-chapter-of-story]", section).forEach((chapter, index) => {
    ScrollTrigger.create({
      trigger: chapter,
      start: `top ${String(CURRENT_AT)}%`,
      end: `bottom ${String(CURRENT_AT)}%`,
      onToggle: ({ isActive }) => {
        if (isActive) mark(index);
      },
    });
  });

  dealMenus(section, (view) => ({ trigger: view, start: "top 85%", end: "top 30%" }));
  const collage = section.querySelector("[data-collage]");
  if (collage) dealScraps(section, { trigger: collage, start: "top 75%", end: "top 25%" });
  growTrunk(section);
  const score = runScore(section);
  if (score) {
    ScrollTrigger.create({
      trigger: score.figure,
      start: "top 80%",
      end: "bottom 55%",
      scrub: true,
      onUpdate: ({ progress }) => {
        score.draw(progress);
      },
    });
  }
  const showShell = clearTheScreen(section, (run) => ({
    trigger: run,
    start: "top 30%",
    end: "bottom 70%",
  }));
  const resetNumbers = countUp(section, (element) => ({ trigger: element, start: "top 90%" }));
  const stopLines = moveLines(
    section,
    (element) => ({ trigger: element, start: "top bottom", end: "bottom top" }),
    (chapter) => ({ trigger: chapter, start: "top bottom", end: "top 55%" }),
  );
  const stopRuler = runRuler(section, () => along.progress * RULER_TRAVEL);

  return () => {
    score?.stop();
    stopLines();
    stopRuler();
    showShell();
    resetNumbers();
  };
}
