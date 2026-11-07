import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  APP_LOOKS,
  DEFAULT_LOOK,
  HomeScreen,
  HomeWire,
  NightScreen,
  NightWire,
  PaywallScreen,
  PaywallWire,
  RuleDemo,
  WelcomeScreen,
  WelcomeWire,
} from "@/ui/app-screens";
import { BASE_FIGURES } from "@/lib/base-graph";

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
    <div className="vault-lanes" data-lanes="">
      <p className="vault-lane-head vault-me">{t("me")}</p>
      <p className="vault-lane-head vault-tool">{t("tool")}</p>
      <ol>
        {ROWS.map((row, index) => (
          <li
            className={["vault-lane", `vault-${row.lane}`, row.stop ? "vault-lane-stop" : ""].join(
              " ",
            )}
            data-step={index}
            key={index}
          >
            <WikiLink note={row.note}>
              <i aria-hidden className="vault-node" />
              <b>{t(`rows.r${index as 0}.title`)}</b>
              <span>{t(`rows.r${index as 0}.text`)}</span>
            </WikiLink>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The board of six style directions. Choosing one is the reader's decision. */
export function Board() {
  const t = useTranslations("flow.board");
  return (
    <figure className="vault-board vault-wide">
      <div aria-label={t("label")} className="vault-board-row" role="group">
        {APP_LOOKS.map((look) => (
          <button
            aria-pressed={look === DEFAULT_LOOK}
            className="vault-sdir"
            data-dir={look}
            key={look}
            type="button"
          >
            <span className="app-frame" data-style={look}>
              <WelcomeScreen />
            </span>
            <span className="vault-sdir-name">
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
    <div className="vault-device">
      <div className="app-frame">
        {wire}
        <div className="app-ui">{screen}</div>
      </div>
    </div>
  );
}

/** A wireframe becoming a screen in place, on the same coordinates. */
export function Compare() {
  const t = useTranslations("flow.compare");
  return (
    <figure
      className="vault-compare vault-wide"
      data-compare=""
      data-sk=""
      data-style={DEFAULT_LOOK}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- it scrolls sideways on a phone. */}
      <div className="vault-compare-row" tabIndex={0}>
        <Device screen={<WelcomeScreen />} wire={<WelcomeWire />} />
        <Device screen={<PaywallScreen />} wire={<PaywallWire />} />
        <Device screen={<HomeScreen />} wire={<HomeWire />} />
        <Device screen={<NightScreen />} wire={<NightWire />} />
        <i aria-hidden className="vault-cutline" />
      </div>
      <div className="vault-compare-ctl" data-js-only="">
        <span className="vault-seg">
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
  return (
    <figure className="vault-ladder vault-wide" data-ladder="" data-rung="0">
      <RuleDemo />
      <ol className="vault-rungs">
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
    <dl className="vault-figures">
      <div>
        <dd>{BASE_FIGURES.rules}</dd>
        <dt>{t("rules")}</dt>
      </div>
      <div>
        <dd>{BASE_FIGURES.scripted}</dd>
        <dt>{t("scripted")}</dt>
      </div>
      <div>
        <dd>{BASE_FIGURES.repeated}</dd>
        <dt>{t("repeated")}</dt>
      </div>
    </dl>
  );
}

export function Icons() {
  return (
    <div className="vault-icons">
      {APP_LOOKS.map((look, index) => (
        <span className={`app-icon app-v${String(index)}`} data-style={look} key={look}>
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
    <figure className="vault-shelf vault-wide" data-sk="" data-style={DEFAULT_LOOK}>
      <a className="vault-shelf-screens" data-note="results" href="#results">
        <span className="vault-device">
          <span className="app-frame">
            <HomeScreen />
          </span>
        </span>
        <span className="vault-device">
          <span className="app-frame">
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
    <div className="vault-store vault-wide">
      {shots.map(({ title, screen }) => (
        <div className="app-shot" data-sk="" data-style={DEFAULT_LOOK} key={title}>
          <p>{t(title)}</p>
          <div className="app-frame">{screen}</div>
        </div>
      ))}
    </div>
  );
}

export function Cta() {
  const t = useTranslations("flow");
  return (
    <p className="vault-note-cta">
      <a className="vault-mod-cta" data-write="" href="https://t.me/finchaf">
        {t("cta")}
      </a>
    </p>
  );
}

/** Stands in for the terminal when no script runs. */
export function Transcript() {
  const t = useTranslations("flow.transcript");
  return (
    <section className="vault-transcript" data-no-js-only="">
      <h3 className="vault-md-h2">{t("title")}</h3>
      <p>{t("text")}</p>
      <pre className="vault-code-block">
        <code>{t("lines")}</code>
      </pre>
    </section>
  );
}

export const EMBEDS: Record<string, ReactNode> = {
  lanes: <Lanes />,
  board: <Board />,
  screens: <Compare />,
  // The results note embeds the comparison under this name; it is the same figure.
  "screens-large": <Compare />,
  ladder: <Ladder />,
  figures: <Figures />,
  shelf: <Shelf />,
  icons: <Icons />,
  store: <Store />,
  cta: <Cta />,
  transcript: <Transcript />,
  tokens: <div className="vault-style-tokens" data-style-tokens="" />,
};
