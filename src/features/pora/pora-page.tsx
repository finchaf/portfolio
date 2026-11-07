import "./pora.css";

import { DoorOpen, GraduationCap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Fragment } from "react";

import { World } from "@/ui/world";

import { LessonWindow } from "./lesson-window";
import { PictureViewer } from "./picture-viewer";
import {
  DAYS,
  LESSONS,
  OPENING,
  RING,
  RING_RADIUS,
  SLOTS,
  WINDOW_ID,
  WINDOWS,
  type Lesson,
} from "./week";
import { WeekClock } from "./week-clock";
import { WindowLauncher } from "./window-launcher";

/**
 * The page is the product's web schedule: a week whose lessons are the chapters of the case. The
 * whole week is in the HTML, so without a script it reads as it is; `WeekClock` only marks today,
 * the dates, the line of the time and the lesson going on, by the reader's clock. On a phone
 * the same week is the product's own list of days. A lesson with a window is a button, as in the
 * product, and its window, the chapter, is in the HTML too.
 */
export function PoraPage() {
  const t = useTranslations("pora");
  const locale = useLocale();
  const at = (lesson: Lesson) => {
    const [start, end] = SLOTS[lesson.slot] ?? SLOTS[0];
    const day = DAYS[lesson.day] ?? DAYS[0];
    return `${t(`week.daysFull.${day}`)}, ${t("week.slot", { n: lesson.slot + 1 })}, ${t("week.span", { start, end })}.`;
  };
  const left = (
    <span className="pora-left" data-pora-left="">
      <svg aria-hidden className="pora-ring" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r={RING_RADIUS} />
        <circle cx="8" cy="8" r={RING_RADIUS} strokeDasharray={RING} strokeDashoffset={RING} />
      </svg>
      <span data-pora-minutes="" />
    </span>
  );
  const badge = (lesson: Lesson) => (
    <span className="pora-badge">
      <i />
      {t(`week.types.${lesson.type}`)}
    </span>
  );
  const opens = (lesson: Lesson) =>
    WINDOWS[lesson.id]
      ? {
          "aria-controls": WINDOW_ID,
          "aria-expanded": false,
          "aria-haspopup": "dialog" as const,
          "data-pora-opens": "",
          type: "button" as const,
        }
      : undefined;

  /** The product's card: a button where the lesson opens, words otherwise. */
  const card = (lesson: Lesson) => {
    const button = opens(lesson);
    const Shell = button ? "button" : "article";
    const Title = button ? "span" : "h2";
    return (
      <Shell className="pora-card" data-lesson={lesson.id} data-type={lesson.type} {...button}>
        <span className="pora-sr">{at(lesson)}</span>
        <span className="pora-card-head">
          <span className="pora-card-top">
            {badge(lesson)}
            {left}
          </span>
          <Title className="pora-card-title">{t(`week.pairs.${lesson.id}.title`)}</Title>
          <span className="pora-card-text">{t(`week.pairs.${lesson.id}.text`)}</span>
        </span>
        <span className="pora-card-rows">
          <span className="pora-card-row">
            <GraduationCap aria-hidden />
            <span>{t(`week.pairs.${lesson.id}.who`)}</span>
          </span>
          <span className="pora-card-row">
            <DoorOpen aria-hidden />
            <span>{t(`week.pairs.${lesson.id}.where`)}</span>
          </span>
        </span>
      </Shell>
    );
  };

  /** A row of the phone's list of days: the same, the product's phone way. */
  const listItem = (lesson: Lesson) => {
    const button = opens(lesson);
    const Shell = button ? "button" : "article";
    const Title = button ? "span" : "h3";
    const [start, end] = SLOTS[lesson.slot] ?? SLOTS[0];
    return (
      <Shell className="pora-list-item" data-lesson={lesson.id} data-type={lesson.type} {...button}>
        <span className="pora-list-when">
          <b>{t("week.spanShort", { start, end })}</b>
          {left}
        </span>
        <span className="pora-list-slot">{t("week.slot", { n: lesson.slot + 1 })}</span>
        <Title className="pora-list-title">{t(`week.pairs.${lesson.id}.title`)}</Title>
        <span className="pora-list-text">{t(`week.pairs.${lesson.id}.text`)}</span>
        <span className="pora-list-meta">
          {badge(lesson)}
          <span>{t(`week.pairs.${lesson.id}.where`)}</span>
        </span>
      </Shell>
    );
  };

  return (
    <World name="pora">
      <div className="pora-page" data-capsule-held="">
        <h1 className="pora-sr">{t("title")}</h1>

        <section aria-label={t("week.grid")} className="pora-week" data-pora-week="">
          <div aria-hidden className="pora-days">
            <i />
            {DAYS.map((day, index) => (
              <p className="pora-day" data-day={index} key={day}>
                <b>{t(`week.days.${day}`)}</b>
                <span data-pora-date={index} />
                <time data-pora-clock="" />
              </p>
            ))}
          </div>

          <div className="pora-rows">
            {SLOTS.map(([start, end], slot) => (
              <Fragment key={start}>
                <p className="pora-time">
                  <b>{t("week.span", { start, end })}</b>
                  <span>{t("week.slot", { n: slot + 1 })}</span>
                </p>
                {DAYS.map((day, index) => {
                  const lesson = LESSONS.find((each) => each.day === index && each.slot === slot);
                  return (
                    <div className="pora-cell" data-day={index} data-slot={slot} key={day}>
                      {lesson && card(lesson)}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>

          <div className="pora-list">
            <p className="pora-range">
              {t("week.label")}
              <span data-pora-range="" />
            </p>
            {DAYS.map((day, index) => {
              const lessons = LESSONS.filter((each) => each.day === index);
              if (lessons.length === 0) return null;
              return (
                <section className="pora-list-day" data-day={index} key={day}>
                  <h2>
                    <span>
                      {t(`week.daysFull.${day}`)}
                      <span data-pora-date={index} data-pora-joined="" />
                    </span>
                    <time data-pora-clock="" />
                  </h2>
                  {lessons.map((lesson) => listItem(lesson))}
                </section>
              );
            })}
          </div>

          <LessonWindow lessons={OPENING} />

          <PictureViewer
            words={{
              label: t("week.viewer.label"),
              close: t("week.viewer.close"),
              previous: t("week.viewer.previous"),
              next: t("week.viewer.next"),
              count: t("week.viewer.count", { n: "{n}", count: "{count}" }),
            }}
          />
          <WindowLauncher />
          <WeekClock
            hours={t("week.hours", { h: "{h}", m: "{m}" })}
            locale={locale}
            minutes={t("week.minutes", { m: "{m}" })}
          />
        </section>
      </div>
    </World>
  );
}
