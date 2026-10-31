import { useLocale, useTranslations } from "next-intl";

import {
  BRANCHES,
  LAUNCH,
  LAUNCH_DOWNLOADS,
  SCORE_DAYS,
  SCORE_MARKED,
  SCORE_ROWS,
} from "./story-data";
import { BEAT_WIDTH, BEATS, beatStart, rowAt } from "./story-score";

/** The first three days and the first two weeks, added up from the export. */
const FIRST_DAYS = LAUNCH_DOWNLOADS.slice(0, 3).reduce((sum, count) => sum + count, 0);
const TWO_WEEKS = LAUNCH_DOWNLOADS.reduce((sum, count) => sum + count, 0);

/** What the score comes to, drawn into the HTML: the canvas of the scene takes over from it. */
function ScoreStill() {
  const SIZE = 1000;
  const rows = Array.from({ length: SCORE_ROWS }, (_, row) => row);
  return (
    <svg
      aria-hidden
      className="story-score-still"
      preserveAspectRatio="none"
      viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}
    >
      {rows.map((row) => (
        <line
          data-marked={row === SCORE_MARKED ? "" : undefined}
          key={row}
          vectorEffect="non-scaling-stroke"
          x1="0"
          x2={SIZE}
          y1={rowAt(row) * SIZE}
          y2={rowAt(row) * SIZE}
        />
      ))}
      {BEATS.map((beat) => (
        <rect
          data-marked={beat.row === SCORE_MARKED ? "" : undefined}
          height={13}
          key={`${String(beat.row)}-${String(beat.day)}-${String(beat.slot)}`}
          width={BEAT_WIDTH * SIZE}
          x={beatStart(beat) * SIZE}
          y={rowAt(beat.row) * SIZE - 6.5}
        />
      ))}
    </svg>
  );
}

/** The week as a score: a row to a group, a stroke to a lesson. A picture, not a real timetable. */
export function StoryScore() {
  const t = useTranslations("home.story.fork");
  return (
    <figure aria-label={t("score")} className="story-score" data-score role="img">
      <ol aria-hidden className="story-score-days">
        {SCORE_DAYS.map((day) => (
          <li data-score-day key={day}>
            {t(`days.${day}`)}
          </li>
        ))}
      </ol>
      <ScoreStill />
      <canvas aria-hidden data-score-canvas />
    </figure>
  );
}

/** The launch as a sheet of real numbers: in two colours, the place, the funnel and the days. */
export function LaunchSheet() {
  const t = useTranslations("home.story.launch");
  const number = new Intl.NumberFormat(useLocale());
  const peak = Math.max(...LAUNCH_DOWNLOADS);
  const funnel = [
    ["impressions", LAUNCH.impressions],
    ["pageViews", LAUNCH.pageViews],
    ["downloads", FIRST_DAYS],
  ] as const;
  const totals = [
    ["twoWeeks", TWO_WEEKS],
    ["total", LAUNCH.total],
  ] as const;
  return (
    <div className="story-sheet">
      <p className="story-sheet-head story-caption" data-reveal>
        <span>{t("sheetTitle")}</span>
        <span>{t("sheetDates")}</span>
      </p>
      <p className="story-rank" data-reveal>
        <span className="story-rank-number font-display" data-lines={14}>
          {t("rank")}
        </span>
        <span className="story-rank-label">{t("rankLabel")}</span>
      </p>
      <div className="story-sheet-part" data-reveal>
        <p className="story-caption">{t("funnelTitle")}</p>
        <dl className="story-funnel">
          {funnel.map(([key, value]) => (
            <div key={key}>
              <dt>{t(key)}</dt>
              <dd className="font-display" data-count={value}>
                {number.format(value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <figure className="story-chart story-sheet-part" data-reveal="stagger">
        <figcaption className="story-caption">
          {t("chart")}
          <span className="sr-only"> {t("chartSummary")}</span>
        </figcaption>
        <div aria-hidden className="story-chart-bars">
          {LAUNCH_DOWNLOADS.map((count, day) => (
            <div className="story-bar" key={day} style={{ "--i": day, "--v": count / peak }}>
              <span>{count}</span>
              <i />
            </div>
          ))}
        </div>
        <div aria-hidden className="story-chart-days">
          {LAUNCH_DOWNLOADS.map((_, day) => (
            <span key={day}>{day + 1}</span>
          ))}
        </div>
      </figure>
      <div className="story-totals" data-reveal>
        <dl>
          {totals.map(([key, value]) => (
            <div key={key}>
              <dt>{t(key)}</dt>
              <dd className="font-display" data-count={value}>
                {number.format(value)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="story-caption">{t("source")}</p>
      </div>
    </div>
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

/**
 * What goes on from the story. In the HTML a list; on a wide screen the scene draws the lines around
 * it, and the last line, in the colours of the next chapter, leaves the screen towards it.
 */
export function StoryBranches() {
  const t = useTranslations("home.story.now.branches");
  return (
    <div className="story-branches">
      <svg aria-hidden className="story-graph" data-graph>
        <path className="story-line" data-line="trunk" />
        <path className="story-line story-line-lit" data-line="first" />
        <path className="story-line" data-line="masters" />
        <g data-tint="pora">
          <path className="story-line story-line-lit" data-line="next" />
        </g>
        <circle className="story-node" data-node="fork-first" r="3.5" />
        <circle className="story-node" data-node="fork-masters" r="3.5" />
        <circle className="story-node story-node-lit" data-node="tip-first" r="5" />
        <circle className="story-node" data-node="tip-masters" r="5" />
      </svg>
      <ul className="story-branch-list" data-branch-list>
        {BRANCHES.map(({ key, label, y, below }) => (
          <li
            className={`story-branch ${below ? "story-branch-below" : ""}`}
            data-branch={key}
            data-reveal
            data-tint={key === "next" ? "pora" : undefined}
            key={key}
            style={{ "--x": label, "--y": y }}
          >
            <code className="story-branch-tag">{t(`${key}.tag`)}</code>
            <h4 className="story-branch-name font-display">{t(`${key}.name`)}</h4>
            <p className="story-branch-text">{t(`${key}.text`)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
