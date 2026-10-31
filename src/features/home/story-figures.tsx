import { useTranslations } from "next-intl";

import { LAUNCH_DOWNLOADS } from "./story-data";

/** Frames on the wall: as many as «100+» asks for, drawn rather than shown. */
const FRAMES = Array.from({ length: 104 }, (_, index) => index);

/** The one a reader's eye lands on, picked out the way Figma picks a frame. */
const PICKED = 44;

/** The file behind the story, as a pattern: the file itself stays private. */
export function FrameWall() {
  const t = useTranslations("home.story.omsk");
  return (
    <figure className="story-wall" data-reveal="stagger">
      <div aria-hidden className="story-wall-frames">
        {FRAMES.map((frame) => (
          <i data-picked={frame === PICKED ? "" : undefined} key={frame} style={{ "--i": frame }} />
        ))}
      </div>
      <figcaption className="story-caption">{t("wall")}</figcaption>
    </figure>
  );
}

const LABELLED = 3;

/** The first two weeks in the store, from the export in story-data.ts. */
export function LaunchChart() {
  const t = useTranslations("home.story.launch");
  const peak = Math.max(...LAUNCH_DOWNLOADS);
  return (
    <figure className="story-chart" data-reveal="stagger">
      <div aria-hidden className="story-chart-bars">
        {LAUNCH_DOWNLOADS.map((count, day) => (
          <div className="story-bar" key={day} style={{ "--i": day, "--v": count / peak }}>
            {day < LABELLED && <span>{count}</span>}
            <i />
          </div>
        ))}
      </div>
      <figcaption className="story-caption">
        {t("chart")}
        <span className="story-chart-summary">{t("chartSummary")}</span>
      </figcaption>
    </figure>
  );
}

const COMMITS = ["first", "assets", "build"] as const;

/** The night in the log of the repository it produced: the times are the commits' own. */
export function NightLog() {
  const t = useTranslations("home.story.night");
  return (
    <figure className="story-log" data-reveal="stagger">
      <figcaption className="story-caption">{t("logLabel")}</figcaption>
      <ol>
        {COMMITS.map((commit, index) => (
          <li key={commit} style={{ "--i": index * 12 }}>
            <span className="text-accent-strong">{t(`log.${commit}.time`)}</span>{" "}
            <span className="text-muted">{t(`log.${commit}.hash`)}</span>{" "}
            {t(`log.${commit}.subject`)}
          </li>
        ))}
      </ol>
    </figure>
  );
}
