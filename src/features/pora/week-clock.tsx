"use client";

import { useEffect, useRef } from "react";

import { DAYS, LESSONS, minutes, placeInDay, SLOTS } from "./week";

const TICK_MS = 30_000;
const DAY_MS = 86_400_000;

/** The length of the ring round the time left, r = 6.25. */
export const RING = 2 * Math.PI * 6.25;

interface Now {
  year: number;
  month: number;
  date: number;
  /** 0 is Monday. */
  weekday: number;
  minute: number;
}

/** The reader's own clock: the page's week runs by the time where it is read. */
function read(): Now {
  const date = new Date();
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    date: date.getDate(),
    weekday: (date.getDay() + 6) % 7,
    minute: date.getHours() * 60 + date.getMinutes(),
  };
}

const clockText = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

interface Words {
  locale: string;
  minutes: string;
  hours: string;
}

/** Writes the week's time into the HTML that is already there: nothing on the page waits for it. */
function paint(root: HTMLElement, words: Words) {
  const now = read();
  const monday = Date.UTC(now.year, now.month - 1, now.date - now.weekday);
  const day = (index: number) => new Date(monday + index * DAY_MS);
  // English puts the month first, and a long one leaves no room for the clock in today's column.
  const date = new Intl.DateTimeFormat(words.locale, {
    day: "numeric",
    month: words.locale === "ru" ? "long" : "short",
    timeZone: "UTC",
  });

  for (const node of root.querySelectorAll<HTMLElement>("[data-pora-date]")) {
    const text = date.format(day(Number(node.dataset.poraDate)));
    node.textContent = node.hasAttribute("data-pora-joined") ? `, ${text}` : text;
  }
  const range = root.querySelector("[data-pora-range]");
  if (range) range.textContent = ` · ${date.formatRange(day(0), day(DAYS.length - 1))}`;

  for (const node of root.querySelectorAll<HTMLElement>("[data-day]")) {
    const today = Number(node.dataset.day) === now.weekday;
    node.toggleAttribute("data-today", today);
    const clock = node.querySelector("[data-pora-clock]");
    if (clock) clock.textContent = today ? clockText(now.minute) : "";
  }

  for (const line of root.querySelectorAll("[data-pora-now]")) line.remove();
  const place = now.weekday < DAYS.length ? placeInDay(now.minute) : null;
  if (place) {
    for (const cell of root.querySelectorAll<HTMLElement>(
      `.pora-cell[data-slot="${place.slot}"]`,
    )) {
      const line = document.createElement("i");
      line.className = "pora-now";
      line.dataset.poraNow = "";
      line.style.setProperty("--at", String(place.share));
      cell.prepend(line);
    }
  }

  for (const lesson of LESSONS) {
    const [start, end] = SLOTS[lesson.slot] ?? SLOTS[0];
    const from = minutes(start);
    const to = minutes(end);
    const going = lesson.day === now.weekday && now.minute >= from && now.minute < to;
    for (const node of root.querySelectorAll<HTMLElement>(`[data-lesson="${lesson.id}"]`)) {
      node.toggleAttribute("data-now", going);
      if (!going) continue;
      const rest = to - now.minute;
      const text =
        rest >= 60
          ? words.hours
              .replace("{h}", String(Math.floor(rest / 60)))
              .replace("{m}", String(rest % 60))
          : words.minutes.replace("{m}", String(rest));
      node.style.setProperty("--pora-share", String(1 - rest / (to - from)));
      const label = node.querySelector<HTMLElement>("[data-pora-minutes]");
      if (label) label.textContent = label.dataset.template?.replace("{time}", text) ?? text;
      const ring = node.querySelector<SVGCircleElement>(".pora-ring circle:last-child");
      ring?.setAttribute("stroke-dashoffset", String(RING * (rest / (to - from))));
    }
  }
}

/**
 * Today, the dates, the line of the time and the lesson going on, by the reader's clock. The
 * HTML is built long before anyone reads it, so these come once a browser can tell the time.
 */
export function WeekClock({ locale, minutes: minuteWords, hours }: Words) {
  const mark = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = mark.current?.closest<HTMLElement>("[data-pora-week]");
    if (!root) return;
    const words = { locale, minutes: minuteWords, hours };
    paint(root, words);
    const timer = setInterval(() => {
      paint(root, words);
    }, TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, [locale, minuteWords, hours]);
  return <span hidden ref={mark} />;
}
