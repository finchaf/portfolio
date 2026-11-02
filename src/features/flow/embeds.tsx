import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  HomeScreen,
  HomeWire,
  NightScreen,
  NightWire,
  PaywallScreen,
  PaywallWire,
  WelcomeScreen,
  WelcomeWire,
} from "./app-screens";
import { WikiLink } from "./markdown";

const ROWS = [
  { lane: "me", note: "stage-1" },
  { lane: "tool", note: "stage-1" },
  { lane: "me", note: "style", stop: true },
  { lane: "tool", note: "stage-1" },
  { lane: "me", note: "edits", stop: true },
  { lane: "tool", note: "stage-2" },
  { lane: "me", note: "stage-2", stop: true },
  { lane: "tool", note: "stage-2" },
  { lane: "me", note: "results", stop: true },
  { lane: "tool", note: "done" },
];

/** The map of a task: decisions on one side, the tool's work on the other, one line through both. */
export function Lanes() {
  const t = useTranslations("flow.lanes");
  return (
    <div className="lanes" data-lanes="">
      <p className="lane-head me">{t("me")}</p>
      <p className="lane-head tool">{t("tool")}</p>
      <ol>
        {ROWS.map((row, index) => (
          <li
            className={["lane", row.lane, row.stop ? "lane-stop" : ""].join(" ")}
            data-step={index}
            key={index}
          >
            <WikiLink note={row.note}>
              <i aria-hidden className="node" />
              <b>{t(`rows.r${index as 0}.title`)}</b>
              <span>{t(`rows.r${index as 0}.text`)}</span>
            </WikiLink>
          </li>
        ))}
      </ol>
    </div>
  );
}

const LOOKS = ["a", "b", "c", "d", "e", "f"] as const;
export const DEFAULT_LOOK = "c";

/** The board of six style directions. Choosing one is the reader's decision. */
export function Board() {
  const t = useTranslations("flow.board");
  return (
    <figure className="board wide">
      <div aria-label={t("label")} className="board-row" role="radiogroup">
        {LOOKS.map((look) => (
          <button
            aria-checked={look === DEFAULT_LOOK}
            className="sdir"
            data-dir={look}
            key={look}
            role="radio"
            type="button"
          >
            <span className="frame mini" data-style={look}>
              <WelcomeScreen />
            </span>
            <span className="sdir-name">
              <b>{look.toUpperCase()}</b> {t(look)}
            </span>
          </button>
        ))}
      </div>
      <figcaption>{t("why")}</figcaption>
    </figure>
  );
}

function Device({ wire, screen }: { wire: ReactNode; screen: ReactNode }) {
  return (
    <div className="device">
      <div className="frame">
        {wire}
        <div className="ui">{screen}</div>
      </div>
    </div>
  );
}

/** A wireframe becoming a screen in place, on the same coordinates. */
export function Compare({ large = false }: { large?: boolean }) {
  const t = useTranslations("flow.compare");
  return (
    <figure
      className={["compare wide", large ? "large" : ""].join(" ")}
      data-compare=""
      data-sk=""
      data-style={DEFAULT_LOOK}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- it scrolls sideways on a phone. */}
      <div className="compare-row" tabIndex={0}>
        <Device screen={<WelcomeScreen />} wire={<WelcomeWire />} />
        <Device screen={<PaywallScreen />} wire={<PaywallWire />} />
        <Device screen={<HomeScreen />} wire={<HomeWire />} />
        <Device screen={<NightScreen />} wire={<NightWire />} />
        <i aria-hidden className="cutline" />
      </div>
      <div className="compare-ctl" data-js-only="">
        <span className="seg">
          <button data-cut="0" type="button">
            {t("wireframe")}
          </button>
          <button aria-pressed="true" data-cut="100" type="button">
            {t("screen")}
          </button>
        </span>
        <input aria-label={t("label")} defaultValue="62" max="100" min="0" type="range" />
      </div>
      <figcaption>{t("caption")}</figcaption>
    </figure>
  );
}

const RUNGS = ["s0", "s1", "s2", "s3", "s4"] as const;

/** The real history of one rule: a note, a rule, the critic, a repeat, a script. */
export function Ladder() {
  const t = useTranslations("flow.ladder");
  const app = useTranslations("flow.app");
  return (
    <figure className="ladder wide" data-ladder="" data-rung="0">
      <div aria-hidden className="demo">
        <div className="d-phone">
          <div className="d-bar">
            <span className="d-title">{app("menuTitle")}</span>
            <span className="d-btn">{app("glyphMore")}</span>
            <span className="d-menu">
              <i>{app("menuShare")}</i>
              <i>{app("menuNote")}</i>
              <i>{app("menuDelete")}</i>
            </span>
          </div>
          <div className="d-body">
            <i />
            <i />
            <i />
          </div>
          <span className="d-check">{app("corner")}</span>
        </div>
      </div>
      <ol className="rungs">
        {RUNGS.map((rung, index) => (
          <li key={rung}>
            <button aria-pressed={index === 0} data-rung-to={index} type="button">
              <i>{index + 1}</i>
              <b>{t(`${rung}.title`)}</b>
              <span>{t(`${rung}.text`)}</span>
              <code>{t(`${rung}.source`)}</code>
            </button>
          </li>
        ))}
      </ol>
    </figure>
  );
}

export function Figures() {
  const t = useTranslations("flow.figures");
  return (
    <dl className="figures">
      <div>
        <dd>{234}</dd>
        <dt>{t("rules")}</dt>
      </div>
      <div>
        <dd>{89}</dd>
        <dt>{t("scripted")}</dt>
      </div>
      <div>
        <dd>{24}</dd>
        <dt>{t("repeated")}</dt>
      </div>
    </dl>
  );
}

export function Icons() {
  return (
    <div className="icons">
      {LOOKS.map((look, index) => (
        <span className={`appicon v${String(index)}`} data-style={look} key={look}>
          <i />
        </span>
      ))}
    </div>
  );
}

/** What a run leaves: screens and icons. */
export function Shelf() {
  const t = useTranslations("flow.shelf");
  return (
    <figure className="shelf wide" data-sk="" data-style={DEFAULT_LOOK}>
      <a className="shelf-screens" data-note="results" href="#results">
        <span className="device">
          <span className="frame">
            <HomeScreen />
          </span>
        </span>
        <span className="device">
          <span className="frame">
            <NightScreen />
          </span>
        </span>
      </a>
      <Icons />
      <figcaption>{t("caption")}</figcaption>
    </figure>
  );
}

export function Store() {
  const t = useTranslations("flow.app");
  const shots = [
    { title: "store1", screen: <WelcomeScreen /> },
    { title: "store2", screen: <NightScreen /> },
    { title: "store3", screen: <HomeScreen /> },
  ] as const;
  return (
    <div className="store wide">
      {shots.map(({ title, screen }) => (
        <div className="shot" data-sk="" data-style={DEFAULT_LOOK} key={title}>
          <p>{t(title)}</p>
          <div className="frame">{screen}</div>
        </div>
      ))}
    </div>
  );
}

export function Cta() {
  const t = useTranslations("flow");
  return (
    <p className="note-cta">
      <a className="mod-cta" data-write="" href="https://t.me/finchaf">
        {t("cta")}
      </a>
    </p>
  );
}

/** Stands in for the terminal when no script runs. */
export function Transcript() {
  const t = useTranslations("flow.transcript");
  return (
    <section className="transcript" data-no-js-only="">
      <h3 className="md-h2">{t("title")}</h3>
      <p>{t("text")}</p>
      <pre className="code-block">
        <code>{t("lines")}</code>
      </pre>
    </section>
  );
}

export const EMBEDS: Record<string, ReactNode> = {
  lanes: <Lanes />,
  board: <Board />,
  screens: <Compare />,
  "screens-large": <Compare large />,
  ladder: <Ladder />,
  figures: <Figures />,
  shelf: <Shelf />,
  icons: <Icons />,
  store: <Store />,
  cta: <Cta />,
  transcript: <Transcript />,
  tokens: <div className="style-tokens" data-style-tokens="" />,
};
