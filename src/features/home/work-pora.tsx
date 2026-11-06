import "./work-pora.css";

import Image, { type StaticImageData } from "next/image";
import { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";

import { LAUNCH_DOWNLOADS } from "@/lib/product";
import { ButtonLink } from "@/ui/button-link";

import { Chapter, Stop } from "./chapter";
import { DEVICES, LAND, PAIR_STOPS, type Place } from "./pair-data";
import androidCardDark from "./pair/android-card-dark.webp";
import androidCardLight from "./pair/android-card-light.webp";
import androidDark from "./pair/android-home-dark.webp";
import androidLight from "./pair/android-home-light.webp";
import appStore from "./pair/app-store.webp";
import iphone from "./pair/device-iphone.webp";
import pixel from "./pair/device-pixel.webp";
import laDark from "./pair/ios-la-dark.webp";
import laLight from "./pair/ios-la-light.webp";
import lockDark from "./pair/ios-lock-dark.webp";
import lockLight from "./pair/ios-lock-light.webp";
import barDark from "./pair/safari-bar-dark.webp";
import barLight from "./pair/safari-bar-light.webp";
import cardDark from "./pair/web-card-dark.webp";
import cardLight from "./pair/web-card-light.webp";
import weekDark from "./pair/web-week-dark.webp";
import weekLight from "./pair/web-week-light.webp";

const STORES = ["appStore", "googlePlay", "ruStore"] as const;
const FACTS = ["stage", "clients", "code"] as const;
const NUMBERS = ["firstDays", "rank", "total"] as const;
const PEAK = Math.max(...LAUNCH_DOWNLOADS);
const PHONE = "(min-width: 64rem) 22rem, 50vw";
/** A frame's own lesson, and the one that travels, repeat what the frame's text already says. */
const NONE = "";

const place = ({ x, y, w, h }: Place): CSSProperties => ({
  left: `${String(x * 100)}%`,
  top: `${String(y * 100)}%`,
  width: `${String(w * 100)}%`,
  height: `${String(h * 100)}%`,
});

/** A frame of the product in both modes: the one the page does not show is never fetched. */
function Both({
  light,
  dark,
  alt,
  sizes,
  className = "",
}: {
  light: StaticImageData;
  dark: StaticImageData;
  alt: string;
  sizes: string;
  className?: string;
}) {
  return (
    <>
      <Image
        alt={alt}
        className={`pair-light ${className}`}
        draggable={false}
        loading="lazy"
        sizes={sizes}
        src={light}
        unoptimized
      />
      <Image
        alt={alt}
        className={`pair-dark ${className}`}
        draggable={false}
        loading="lazy"
        sizes={sizes}
        src={dark}
        unoptimized
      />
    </>
  );
}

/** The lesson's card as the web schedule draws it, the one that travels. */
function Card({ alt }: { alt: string }) {
  return <Both alt={alt} dark={cardDark} light={cardLight} sizes="24rem" />;
}

/** Where the lesson lands on a frame. Without a scene it holds what lands there. */
function Hold({ name, at, children }: { name: string; at?: Place; children?: ReactNode }) {
  return (
    <span className="pair-hold" data-pair-hold={name} style={at ? place(at) : undefined}>
      {children}
    </span>
  );
}

/** A window of Safari, its bar from the owner's mockup with the schedule's address on it. */
function Browser({ children }: { children: ReactNode }) {
  return (
    <div className="pair-browser">
      <span aria-hidden className="pair-browser-bar">
        <Both alt={NONE} dark={barDark} light={barLight} sizes="(min-width: 64rem) 60vw, 92vw" />
      </span>
      <div className="pair-browser-body">{children}</div>
    </div>
  );
}

const DEVICE_PICTURES = { ios: iphone, android: pixel } as const;

/** A phone: the screen of the simulator under the mockup of the device, its glass cut out. */
function Phone({ kind, children }: { kind: keyof typeof DEVICES; children: ReactNode }) {
  const { width, height, screen } = DEVICES[kind];
  return (
    <div className="pair-phone" style={{ aspectRatio: `${String(width)} / ${String(height)}` }}>
      <div
        className="pair-screen"
        style={{
          ...place({
            x: screen.x / width,
            y: screen.y / height,
            w: screen.w / width,
            h: screen.h / height,
          }),
          borderRadius: `${String((screen.r / screen.w) * 100)}% / ${String((screen.r / screen.h) * 100)}%`,
        }}
      >
        {children}
      </div>
      <Image
        alt={NONE}
        className="pair-device"
        draggable={false}
        loading="lazy"
        sizes={PHONE}
        src={DEVICE_PICTURES[kind]}
        unoptimized
      />
    </div>
  );
}

/** A stop's name as the product's badge of a lesson: its dot wears the stop's type (work-pora.css). */
function Kicker({ label }: { label: string }) {
  return (
    <p className="pair-kicker">
      <i aria-hidden />
      {label}
    </p>
  );
}

/** «Пора на пару», one lesson through the whole product: the web, iOS, Android, the editor, the start. */
export function WorkPora() {
  const t = useTranslations("home.work");
  const p = useTranslations("home.work.pora");
  const lesson = p("lesson");
  const week = (
    <Both
      alt={p("web.alt")}
      className="pair-fill"
      dark={weekDark}
      light={weekLight}
      sizes="(min-width: 64rem) 52vw, 92vw"
    />
  );
  return (
    <Chapter
      axis="y"
      bar={{ skin: "paper" }}
      index={1}
      name={p("name")}
      next={{ href: "#work-flow", label: t("next.flow") }}
      open={t("open")}
      path="/poranaparu"
      ticks={PAIR_STOPS.map((stop) => p(`ticks.${stop}`))}
      world="pora"
    >
      <ol className="chapter-stops">
        <Stop
          copy={
            <>
              <p className="pair-label">{p("label")}</p>
              <h3 className="stop-title stop-title-large">{p("name")}</h3>
              <p className="stop-text">{p("text")}</p>
              <dl className="pair-facts">
                {FACTS.map((fact) => (
                  <div key={fact}>
                    <dt>{p(`facts.${fact}.term`)}</dt>
                    <dd>{p(`facts.${fact}.value`)}</dd>
                  </div>
                ))}
              </dl>
              <p className="pair-note">{p("note")}</p>
            </>
          }
          visual={
            <div className="pair-hero">
              <Hold name="hero">
                <Card alt={lesson} />
              </Hold>
            </div>
          }
        />
        <Stop
          copy={
            <>
              <Kicker label={p("ticks.web")} />
              <h3 className="stop-title">{p("web.title")}</h3>
              <p className="stop-text">{p("web.text")}</p>
            </>
          }
          visual={
            <Browser>
              {week}
              <Hold at={LAND.web} name="web">
                <Card alt={lesson} />
              </Hold>
            </Browser>
          }
        />
        <Stop
          copy={
            <>
              <Kicker label={p("ticks.ios")} />
              <h3 className="stop-title">{p("ios.title")}</h3>
              <p className="stop-text">{p("ios.text")}</p>
            </>
          }
          visual={
            <Phone kind="ios">
              <Both
                alt={p("ios.alt")}
                className="pair-fill"
                dark={lockDark}
                light={lockLight}
                sizes={PHONE}
              />
              <Hold at={LAND.la} name="la">
                <Both alt={NONE} dark={laDark} light={laLight} sizes={PHONE} />
              </Hold>
            </Phone>
          }
        />
        <Stop
          copy={
            <>
              <Kicker label={p("ticks.android")} />
              <h3 className="stop-title">{p("android.title")}</h3>
              <p className="stop-text">{p("android.text")}</p>
            </>
          }
          visual={
            <Phone kind="android">
              <Both
                alt={p("android.alt")}
                className="pair-fill"
                dark={androidDark}
                light={androidLight}
                sizes={PHONE}
              />
              <Hold at={LAND.android} name="android">
                <Both alt={NONE} dark={androidCardDark} light={androidCardLight} sizes={PHONE} />
              </Hold>
            </Phone>
          }
        />
        <Stop
          copy={
            <>
              <Kicker label={p("ticks.editor")} />
              <h3 className="stop-title">{p("editor.title")}</h3>
              <p className="stop-text">{p("editor.text")}</p>
            </>
          }
          visual={
            <Browser>
              {week}
              <p aria-hidden className="pair-tool">
                <b>{p("editor.toolbar")}</b>
                <span className="pair-draft">
                  <i />
                  {p("editor.draft")}
                </span>
                <span className="pair-tool-ways">
                  <span>{p("editor.undo")}</span>
                  <span>{p("editor.publish")}</span>
                </span>
              </p>
              <Hold at={LAND.clash} name="clash" />
              <Hold at={LAND.free} name="free">
                <Card alt={lesson} />
              </Hold>
              <p className="pair-verdict" data-pair-verdict>
                <span data-clash>{p("editor.conflict")}</span>
                <span data-published>{p("editor.published")}</span>
              </p>
            </Browser>
          }
        />
        <Stop
          copy={
            <>
              <Kicker label={p("ticks.origin")} />
              <h3 className="stop-title">{p("origin.title")}</h3>
              <p className="stop-text">{p("origin.text")}</p>
              <ul className="pair-numbers">
                {NUMBERS.map((number) => (
                  <li key={number}>
                    <b>{p(`origin.numbers.${number}.n`)}</b>
                    <span>{p(`origin.numbers.${number}.l`)}</span>
                    <time>{p(`origin.numbers.${number}.d`)}</time>
                  </li>
                ))}
              </ul>
              <p className="pair-ways">
                <ButtonLink href={p("origin.siteUrl")} rel="noopener" size="small" target="_blank">
                  {p("origin.site")}
                </ButtonLink>
                {STORES.map((store) => (
                  <ButtonLink
                    href={p(`${store}Url`)}
                    key={store}
                    rel="noopener"
                    size="small"
                    target="_blank"
                    tone="quiet"
                  >
                    {p(store)}
                  </ButtonLink>
                ))}
              </p>
            </>
          }
          visual={
            <div className="pair-origin">
              <figure className="pair-store">
                <Image
                  alt={p("origin.appStore")}
                  draggable={false}
                  loading="lazy"
                  sizes="(min-width: 64rem) 22rem, 70vw"
                  src={appStore}
                  unoptimized
                />
              </figure>
              <figure className="pair-chart">
                <figcaption>
                  <b>{p("origin.chart.title")}</b>
                  <span>{p("origin.chart.source")}</span>
                  <span className="sr-only">{p("origin.chart.summary")}</span>
                </figcaption>
                <div aria-hidden className="pair-bars">
                  {LAUNCH_DOWNLOADS.map((count, index) => (
                    <i
                      data-peak={count === PEAK ? "" : undefined}
                      data-value={count}
                      key={index}
                      style={{ "--share": count / PEAK }}
                    />
                  ))}
                </div>
                <p aria-hidden className="pair-axis">
                  <span>{p("origin.chart.from")}</span>
                  <span>{p("origin.chart.to")}</span>
                </p>
              </figure>
            </div>
          }
        />
      </ol>
      <div aria-hidden className="pair-fly" data-pair-fly>
        <span className="pair-form" data-pair-form="web">
          <Card alt={NONE} />
        </span>
        <span className="pair-form" data-pair-form="la">
          <Both alt={NONE} dark={laDark} light={laLight} sizes={PHONE} />
        </span>
        <span className="pair-form" data-pair-form="android">
          <Both alt={NONE} dark={androidCardDark} light={androidCardLight} sizes={PHONE} />
        </span>
      </div>
    </Chapter>
  );
}
