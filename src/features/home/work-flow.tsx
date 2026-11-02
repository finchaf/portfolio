import "@/themes/flow-looks.css";
import "@/ui/app-screens.css";
import "./flow-map.css";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { BASE_FIGURES, CHECKLISTS } from "@/lib/base-graph";
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

import { Chapter } from "./chapter";
import { STOPS } from "./flow-map-graph";

const RUNGS = ["s0", "s1", "s2", "s3", "s4"] as const;
const WIRES = [
  <WelcomeWire key="a" />,
  <PaywallWire key="b" />,
  <HomeWire key="c" />,
  <NightWire key="d" />,
];
const SCREENS = [
  <WelcomeScreen key="a" />,
  <PaywallScreen key="b" />,
  <HomeScreen key="c" />,
  <NightScreen key="d" />,
];

function MapStop({ copy, object }: { copy: ReactNode; object?: ReactNode }) {
  return (
    <li className="map-stop" data-map-stop>
      <div className="map-copy">{copy}</div>
      {object ? (
        <div className="map-object" data-map-object>
          {object}
        </div>
      ) : null}
    </li>
  );
}

/** Who did what at a stop: the coloured dot is a decision, as on the map of the Flow page. */
function Roles({ me, tool }: { me: string; tool: string }) {
  const t = useTranslations("home.work.flow.roles");
  return (
    <dl className="map-roles" data-map-line>
      <div>
        <dt>
          <i data-me />
          {t("me")}
        </dt>
        <dd>{me}</dd>
      </div>
      <div>
        <dt>
          <i />
          {t("tool")}
        </dt>
        <dd>{tool}</dd>
      </div>
    </dl>
  );
}

function StepCopy({
  step,
  number,
}: {
  step: "brief" | "research" | "screens" | "handoff";
  number: number;
}) {
  const f = useTranslations(`home.work.flow.steps.${step}`);
  return (
    <>
      <p className="map-number" data-map-line>
        {String(number).padStart(2, "0")}
      </p>
      <h3 className="stop-title" data-map-title>
        {f("title")}
      </h3>
      <p className="stop-text" data-map-line>
        {f("text")}
      </p>
      <Roles me={f("me")} tool={f("tool")} />
      <p className="map-command" data-map-line>
        {f("command")}
      </p>
    </>
  );
}

/** A task's run, as it was. The direction it asks about is the one the reader chooses. */
function Terminal() {
  const t = useTranslations("flow");
  return (
    <div aria-hidden className="map-terminal" data-piece>
      <p className="map-terminal-head">
        <b>{t("terminal.title")}</b>
        <span>{t("terminal.replay")}</span>
      </p>
      <div className="map-terminal-body" data-terminal>
        {t("transcript.lines")
          .split("\n")
          .map((line) => {
            const asks = /: C$/.test(line);
            const [, step, said] = /^(\s*✓ \S+)(\s.*)$/.exec(line) ?? [];
            const shape = line.startsWith("$")
              ? "run"
              : line.includes("✓")
                ? "done"
                : line.includes("?")
                  ? "ask"
                  : "";
            return (
              <p data-line={shape} key={line}>
                {step && said ? <span data-step>{step}</span> : null}
                {step && said ? said : asks ? line.slice(0, -1) : line}
                {asks ? <span data-look-letter>{DEFAULT_LOOK.toUpperCase()}</span> : null}
              </p>
            );
          })}
      </div>
    </div>
  );
}

function Board() {
  const t = useTranslations("flow.board");
  return (
    <div aria-label={t("label")} className="map-board" role="radiogroup">
      {APP_LOOKS.map((look) => (
        <button
          aria-checked={look === DEFAULT_LOOK}
          className="map-tile"
          data-look={look}
          data-piece
          key={look}
          role="radio"
          type="button"
        >
          <span className="frame" data-style={look}>
            <WelcomeScreen />
          </span>
          <span className="map-tile-name">
            <b>{look.toUpperCase()}</b> {t(look)}
          </span>
        </button>
      ))}
    </div>
  );
}

function Phone({ wire, screen }: { wire?: ReactNode; screen?: ReactNode }) {
  return (
    <div className="map-phone" data-piece>
      <div className="frame">
        {wire}
        {screen ? <div className="ui">{screen}</div> : null}
      </div>
    </div>
  );
}

/** A task's screens, in the style the reader chose. */
function Looks({
  className,
  cut = false,
  children,
}: {
  className: string;
  cut?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden
      className={className}
      data-cut-row={cut ? "" : undefined}
      data-look-target
      data-style={DEFAULT_LOOK}
    >
      {children}
      {cut ? <i className="map-cut" data-cut /> : null}
    </div>
  );
}

function Handoff() {
  return (
    <div className="map-file">
      <Looks className="map-file-screens">
        {SCREENS.slice(1).map((screen, index) => (
          <Phone key={index} screen={screen} />
        ))}
      </Looks>
      <div aria-hidden className="map-file-icons">
        {APP_LOOKS.map((look, index) => (
          <span className={`appicon v${String(index)}`} data-piece data-style={look} key={look}>
            <i />
          </span>
        ))}
      </div>
    </div>
  );
}

/** One rule's history, rung by rung: the scene climbs it, and without the scene it reads top to bottom. */
function Ladder() {
  const t = useTranslations("flow.ladder");
  return (
    <figure className="map-ladder" data-rung={RUNGS.length - 1}>
      <div data-piece>
        <RuleDemo />
      </div>
      <ol className="map-rungs" data-piece="bare">
        {RUNGS.map((rung) => (
          <li data-rung-row key={rung}>
            <b>{t(`${rung}.title`)}</b>
            <span>{t(`${rung}.text`)}</span>
            <code>{t(`${rung}.source`)}</code>
          </li>
        ))}
      </ol>
    </figure>
  );
}

/**
 * Flow on the home page, as a flight along its own graph. In the HTML these are sections with what
 * they show. The scene in flow-map-scene.ts draws the base on the canvas and opens each stop out of
 * its node; every figure and line here comes from the Flow page.
 */
export function WorkFlow() {
  const t = useTranslations("home.work");
  const f = useTranslations("home.work.flow");
  const b = useTranslations("flow.figures");
  const names = useTranslations("flow.checklists");
  const hubs = Object.fromEntries(CHECKLISTS.map(([id]) => [id, names(id)]));
  const ticks = STOPS.map((stop) => f(`ticks.${stop}`));
  const facts = ["period", "volume", "rules"] as const;
  const figures = ["rules", "scripted", "repeated"] as const;
  return (
    <Chapter
      axis="x"
      index={2}
      name={f("name")}
      next={{ href: "#work-projects", label: t("next.projects") }}
      open={t("open")}
      path="/flow"
      ticks={ticks}
      world="flow"
    >
      <div className="map" data-map>
        <canvas
          aria-hidden
          className="map-canvas"
          data-hubs={JSON.stringify(hubs)}
          data-map-canvas
          data-ticks={JSON.stringify(ticks)}
          data-unit={f("hubUnit")}
        />
        <p aria-hidden className="map-tip" data-map-tip hidden />
        <ol className="map-stops">
          <MapStop
            copy={
              <>
                <p className="map-label" data-map-line>
                  {f("label")}
                </p>
                <h3 className="stop-title stop-title-large" data-map-title>
                  {f("name")}
                </h3>
                <p className="stop-text" data-map-line>
                  {f("text")}
                </p>
                <dl className="map-facts" data-map-line>
                  {facts.map((fact) => (
                    <div key={fact}>
                      <dt>{f(`facts.${fact}.term`)}</dt>
                      <dd>{f(`facts.${fact}.value`)}</dd>
                    </div>
                  ))}
                </dl>
                <p className="map-note" data-map-line>
                  {f("note")}
                </p>
              </>
            }
            object={<Terminal />}
          />
          <MapStop
            copy={
              <>
                <StepCopy number={1} step="brief" />
                <p className="map-hint" data-map-line>
                  {f("steps.brief.hint")}
                </p>
              </>
            }
            object={<Board />}
          />
          <MapStop
            copy={<StepCopy number={2} step="research" />}
            object={
              <Looks className="map-row">
                {WIRES.map((wire, index) => (
                  <Phone key={index} wire={wire} />
                ))}
              </Looks>
            }
          />
          <MapStop
            copy={<StepCopy number={3} step="screens" />}
            object={
              <Looks className="map-row" cut>
                {WIRES.map((wire, index) => (
                  <Phone key={index} screen={SCREENS[index]} wire={wire} />
                ))}
              </Looks>
            }
          />
          <MapStop copy={<StepCopy number={4} step="handoff" />} object={<Handoff />} />
          <MapStop
            copy={
              <>
                <p className="map-number" data-map-line>
                  {String(5).padStart(2, "0")}
                </p>
                <h3 className="stop-title" data-map-title>
                  {f("steps.rule.title")}
                </h3>
                <p className="stop-text" data-map-line>
                  {f("steps.rule.text")}
                </p>
                <p className="map-command" data-map-line>
                  {f("steps.rule.command")}
                </p>
              </>
            }
            object={<Ladder />}
          />
          <MapStop
            copy={
              <>
                <p className="map-number" data-map-line>
                  {String(6).padStart(2, "0")}
                </p>
                <h3 className="stop-title" data-map-title>
                  {f("steps.base.title")}
                </h3>
                <p className="stop-text" data-map-line>
                  {f("steps.base.text")}
                </p>
                <dl className="map-figures" data-map-line>
                  {figures.map((figure) => (
                    <div key={figure}>
                      <dd data-count={BASE_FIGURES[figure]}>{BASE_FIGURES[figure]}</dd>
                      <dt>{b(figure)}</dt>
                    </div>
                  ))}
                </dl>
                <p className="map-note" data-map-line>
                  {f("figuresDate")}
                </p>
              </>
            }
          />
        </ol>
      </div>
    </Chapter>
  );
}
