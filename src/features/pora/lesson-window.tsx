import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  DoorOpen,
  GraduationCap,
  Maximize2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { localizedPath } from "@/i18n/localized-path";
import { CLIENT_COMMITS, LAUNCH_DOWNLOADS } from "@/lib/product";
import { ScrollBar } from "@/ui/scroll-bar";

import type { Picture } from "./pictures";
import {
  DAYS,
  type Figure,
  LESSON_HUES,
  SLOTS,
  WINDOW_ID,
  WINDOWS,
  type Lesson,
  type LessonWindowSpec,
} from "./week";

const CLIENTS = ["ios", "android", "web"] as const;

/**
 * The lessons' window, made a chapter of the case: the product's «Окно пары» (apps/schedule,
 * lesson-dialog.tsx), its sizes times 1.25, and wider, as a chapter is read and not glanced at.
 * One native <dialog> holds a page for each lesson that opens, one of them shown: going to the
 * lesson before or after changes the page and not the window, so the frame, the veil and the focus
 * stay where they are. `WindowLauncher` opens, turns and closes it.
 */
export function LessonWindow({ lessons }: { lessons: readonly Lesson[] }) {
  const first = lessons[0];
  if (!first) return null;
  return (
    <dialog
      aria-describedby={`${WINDOW_ID}-${first.id}-when`}
      aria-labelledby={`${WINDOW_ID}-${first.id}-title`}
      className="pora-window"
      id={WINDOW_ID}
    >
      {lessons.map((lesson, index) => {
        const spec = WINDOWS[lesson.id];
        return spec ? (
          <LessonPage
            hidden={index > 0}
            key={lesson.id}
            lesson={lesson}
            next={lessons[index + 1]}
            previous={lessons[index - 1]}
            spec={spec}
          />
        ) : null;
      })}
    </dialog>
  );
}

/**
 * A lesson's page of the window. On the left the stub on the paper, in the tone of the lesson's
 * type: the slot, its time, the day. On the right the type in mono capitals and the name, the
 * chapter in sections, and beside it the numbers with their dates, the timeline, the people and the
 * places in the product's rows. The footer walks the lessons that open, in the week's order.
 */
function LessonPage({
  lesson,
  spec,
  previous,
  next,
  hidden,
}: {
  lesson: Lesson;
  spec: LessonWindowSpec;
  previous?: Lesson | undefined;
  next?: Lesson | undefined;
  hidden: boolean;
}) {
  const t = useTranslations("pora.week");
  const locale = useLocale();
  const key = `pairs.${lesson.id}.window` as const;
  const text = (path: string) => t(`${key}.${path}` as never);
  const [start, end] = SLOTS[lesson.slot] ?? SLOTS[0];
  const day = DAYS[lesson.day] ?? DAYS[0];
  const id = `${WINDOW_ID}-${lesson.id}`;
  const peak = Math.max(...LAUNCH_DOWNLOADS);
  const commitPeak = Math.max(
    ...CLIENT_COMMITS.ios,
    ...CLIENT_COMMITS.android,
    ...CLIENT_COMMITS.web,
  );

  /** The launch by day: the bars in the lesson's colour, the peak named. */
  const downloads = (key: string) => (
    <figure className="pora-window-chart">
      <figcaption>
        <b>{text(`${key}.title`)}</b>
        <span>{text(`${key}.source`)}</span>
        <span className="pora-sr">{text(`${key}.summary`)}</span>
      </figcaption>
      <div aria-hidden className="pora-window-bars">
        {LAUNCH_DOWNLOADS.map((count, index) => (
          <i
            data-peak={count === peak ? "" : undefined}
            data-value={count}
            key={index}
            style={{ "--share": count / peak }}
          />
        ))}
      </div>
      <p aria-hidden className="pora-window-axis">
        <span>{text(`${key}.from`)}</span>
        <span>{text(`${key}.to`)}</span>
      </p>
    </figure>
  );

  /** A picture to open: both modes in the HTML, the hidden one never fetched, the sign on hover. */
  const picture = (each: Picture) => {
    const words = text(`pictures.${each.key}`);
    return (
      <button
        aria-haspopup="dialog"
        aria-label={t("window.look", { what: words })}
        className="pora-window-picture"
        data-caption={words}
        data-pora-picture=""
        key={each.key}
        type="button"
      >
        <Image
          alt={words}
          className={each.dark ? "pora-only-light" : undefined}
          loading="lazy"
          sizes="(min-width: 64rem) 40rem, 100vw"
          src={each.light}
          unoptimized
        />
        {each.dark && (
          <Image
            alt={words}
            className="pora-only-dark"
            loading="lazy"
            sizes="(min-width: 64rem) 40rem, 100vw"
            src={each.dark}
            unoptimized
          />
        )}
        <Maximize2 aria-hidden />
      </button>
    );
  };

  const figure = (shown: Figure) => {
    switch (shown.kind) {
      case "downloads":
        return downloads(shown.key);
      case "pictures":
        return (
          <figure className="pora-window-figure">
            <div className="pora-window-pictures" data-count={shown.pictures.length}>
              {shown.pictures.map(picture)}
            </div>
            <figcaption>{text(`figures.${shown.key}`)}</figcaption>
          </figure>
        );
      case "hues":
        return (
          <figure className="pora-window-figure">
            <ul className="pora-window-hues">
              {LESSON_HUES.map((each) => (
                <li data-type={each.type} key={each.type}>
                  <i aria-hidden />
                  <span>{t(`types.${each.type}`)}</span>
                  <code>
                    <span>{each.hue}</span>
                    <span>{t("window.hue", { light: each.light, dark: each.dark })}</span>
                  </code>
                </li>
              ))}
            </ul>
            <figcaption>{text(`figures.${shown.key}`)}</figcaption>
          </figure>
        );
      case "commits":
        return (
          <figure className="pora-window-chart">
            <figcaption>
              <b>{text(`figures.${shown.key}.title`)}</b>
              <span>{text(`figures.${shown.key}.source`)}</span>
              <span className="pora-sr">{text(`figures.${shown.key}.summary`)}</span>
            </figcaption>
            <div aria-hidden className="pora-window-months">
              {CLIENT_COMMITS.months.map((month, index) => (
                <div key={month}>
                  <span className="pora-window-month-bars">
                    {CLIENTS.map((client) => {
                      const count = CLIENT_COMMITS[client][index] ?? 0;
                      return (
                        <i
                          data-client={client}
                          data-value={count > 0 ? count : undefined}
                          key={client}
                          style={{ "--share": count / commitPeak }}
                        />
                      );
                    })}
                  </span>
                  <span>{text(`figures.${shown.key}.months.${month}`)}</span>
                </div>
              ))}
            </div>
            <p aria-hidden className="pora-window-legend">
              {CLIENTS.map((client) => (
                <span data-client={client} key={client}>
                  <i />
                  {text(`figures.${shown.key}.clients.${client}`)}
                </span>
              ))}
            </p>
          </figure>
        );
      case "steps":
        return (
          <figure className="pora-window-figure">
            <ol className="pora-window-flow">
              {shown.steps.map((step, index) => (
                <li key={step}>
                  <b aria-hidden>{index + 1}</b>
                  <span>
                    <span>{text(`figures.${shown.key}.${step}.title`)}</span>
                    <span>{text(`figures.${shown.key}.${step}.text`)}</span>
                  </span>
                </li>
              ))}
            </ol>
            <figcaption>{text(`figures.${shown.key}.caption`)}</figcaption>
          </figure>
        );
    }
  };
  const step = (other: Lesson, way: "previous" | "next") => (
    <button
      aria-label={`${t(`window.${way}`)}: ${t(`pairs.${other.id}.title`)}`}
      className="pora-window-step"
      data-pora-go={other.id}
      data-type={other.type}
      data-way={way}
      type="button"
    >
      {way === "previous" && (
        <kbd aria-hidden>
          <ArrowLeft />
        </kbd>
      )}
      <i aria-hidden />
      <span>{t(`pairs.${other.id}.title`)}</span>
      {way === "next" && (
        <kbd aria-hidden>
          <ArrowRight />
        </kbd>
      )}
    </button>
  );

  return (
    <div
      className="pora-window-page"
      data-lesson={lesson.id}
      data-type={lesson.type}
      hidden={hidden}
      id={id}
    >
      <div className="pora-stub">
        <i aria-hidden className="pora-grain" />
        <i aria-hidden className="pora-tone" />
        <div className="pora-stub-top">
          <p className="pora-stub-slot">
            <i aria-hidden />
            {t("slot", { n: lesson.slot + 1 })}
          </p>
          <p className="pora-stub-time">
            <span>{start}</span>
            <span>{end}</span>
          </p>
        </div>
        <div className="pora-stub-bottom">
          <p id={`${id}-when`}>
            {t(`days.${day}`)}
            <span data-pora-date={lesson.day} data-pora-joined="" />
          </p>
          <p
            className="pora-stub-left"
            data-pora-minutes=""
            data-template={t("window.left", { time: "{time}" })}
          />
        </div>
        <span aria-hidden className="pora-stub-progress">
          <i />
        </span>
        <button
          aria-label={t("window.close")}
          className="pora-window-x"
          data-pora-close=""
          type="button"
        >
          <X aria-hidden />
        </button>
      </div>

      <div className="pora-window-body">
        <div className="pora-window-area">
          <div
            aria-labelledby={`${id}-title`}
            className="pora-window-scroll"
            role="region"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the chapter scrolls by keys too.
            tabIndex={0}
          >
            <div className="pora-window-columns">
              <div className="pora-window-main">
                <header className="pora-window-head">
                  <p className="pora-window-type">{t(`types.${lesson.type}`)}</p>
                  <h2 id={`${id}-title`}>{t(`pairs.${lesson.id}.title`)}</h2>
                </header>
                <p className="pora-window-lead">{text("lead")}</p>
                {spec.sections.map((section) => (
                  <section className="pora-window-section" key={section.key}>
                    <h3>{text(`sections.${section.key}.title`)}</h3>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{text(`sections.${section.key}.${paragraph}`)}</p>
                    ))}
                    {section.figure && figure(section.figure)}
                  </section>
                ))}
                {spec.chart && downloads("chart")}
              </div>

              <aside className="pora-window-aside">
                {spec.facts.length > 0 && (
                  <section className="pora-window-group">
                    <h3>{t("window.facts")}</h3>
                    <ul className="pora-window-facts">
                      {spec.facts.map((fact) => (
                        <li key={fact}>
                          <b>{text(`facts.${fact}.n`)}</b>
                          <span>
                            <span>{text(`facts.${fact}.l`)}</span>
                            <span className="pora-window-date">{text(`facts.${fact}.d`)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {spec.timeline.length > 0 && (
                  <section className="pora-window-group">
                    <h3>{t("window.timeline")}</h3>
                    <ol className="pora-window-timeline">
                      {spec.timeline.map((moment) => (
                        <li key={moment}>
                          <span className="pora-window-date">
                            {text(`timeline.${moment}.date`)}
                          </span>
                          <span>{text(`timeline.${moment}.text`)}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {spec.people.length > 0 && (
                  <section className="pora-window-group">
                    <h3>{t("window.people")}</h3>
                    <ul>
                      {spec.people.map((person) => (
                        <li className="pora-window-row" key={person}>
                          <GraduationCap aria-hidden />
                          <span>
                            <span>{text(`people.${person}.name`)}</span>
                            <span>{text(`people.${person}.line`)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {spec.places.length > 0 && (
                  <section className="pora-window-group">
                    <h3>{t("window.links")}</h3>
                    <ul>
                      {spec.places.map((place) => {
                        const words = (
                          <span>
                            <span>{text(`places.${place.key}.name`)}</span>
                            <span>{text(`places.${place.key}.line`)}</span>
                          </span>
                        );
                        return (
                          <li key={place.key}>
                            {place.page ? (
                              <Link
                                className="pora-window-row"
                                href={localizedPath(locale, place.page)}
                              >
                                <DoorOpen aria-hidden />
                                {words}
                                <ChevronRight aria-hidden />
                              </Link>
                            ) : (
                              <a
                                className="pora-window-row"
                                href={place.href ?? text(`places.${place.key}.href`)}
                                rel="noopener"
                                target="_blank"
                              >
                                <DoorOpen aria-hidden />
                                {words}
                                <ArrowUpRight aria-hidden />
                              </a>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}
              </aside>
            </div>
          </div>
          <ScrollBar />
        </div>

        <div className="pora-window-foot">
          <i aria-hidden className="pora-grain" />
          <i aria-hidden className="pora-tone" />
          <p aria-hidden className="pora-window-hint">
            <kbd>{t("window.escape")}</kbd>
            {t("window.close")}
          </p>
          {(previous ?? next) && (
            <nav aria-label={t(`pairs.${lesson.id}.title`)} className="pora-window-steps">
              {previous && step(previous, "previous")}
              {next && step(next, "next")}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
