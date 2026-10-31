import { useLocale, useTranslations } from "next-intl";

import { LAUNCH, LAUNCH_DOWNLOADS } from "./story-data";

/** The first three days and the first two weeks, added up from the export. */
const FIRST_DAYS = LAUNCH_DOWNLOADS.slice(0, 3).reduce((sum, count) => sum + count, 0);
const TWO_WEEKS = LAUNCH_DOWNLOADS.reduce((sum, count) => sum + count, 0);

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
