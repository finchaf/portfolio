import { useTranslations } from "next-intl";

import { Chapter } from "./chapter";
import { FlowGraph } from "./flow-graph";
import { MiniTerminal } from "./mini-terminal";
import { Placeholder } from "./placeholder";

const TICKS = ["intro", "brief", "research", "screens", "handoff", "base"] as const;
const STEPS = ["brief", "research", "screens", "handoff"] as const;
const TERMINAL_KEYS = [
  "line1",
  "line2",
  "line3",
  "line4",
  "line5",
  "line6",
  "line7",
  "line8",
  "line9",
] as const;

/** Flow, sideways: a line runs through the stages of a task and closes on the knowledge base. */
export function WorkFlow() {
  const t = useTranslations("home.work");
  const f = useTranslations("home.work.flow");
  return (
    <Chapter
      axis="x"
      index={2}
      name={f("name")}
      next={{ href: "#work-projects", label: t("next.projects") }}
      open={t("open")}
      path="/flow"
      ticks={TICKS.map((tick) => f(`ticks.${tick}`))}
      world="flow"
    >
      <ol className="flow-track" data-track>
        <li aria-hidden className="flow-line" data-flow-line />
        <li className="flow-panel flow-panel-intro" data-panel>
          <div className="flow-copy">
            <p className="font-mono text-sm text-muted">{f("label")}</p>
            <h3 className="stop-title stop-title-large">{f("name")}</h3>
            <p className="stop-text">{f("text")}</p>
            <p className="text-sm text-muted">{f("note")}</p>
          </div>
          <div data-panel-visual>
            <MiniTerminal lines={TERMINAL_KEYS.map((line) => f(`terminal.${line}`))} />
          </div>
        </li>
        {STEPS.map((step, index) => (
          <li className="flow-panel" data-panel key={step}>
            <i aria-hidden className="flow-node" data-flow-node />
            <div className="flow-copy">
              <p className="font-mono text-sm text-accent-strong">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="stop-title">{f(`steps.${step}.title`)}</h3>
              <p className="stop-text">{f(`steps.${step}.text`)}</p>
              <p className="font-mono text-sm text-muted">{f(`steps.${step}.command`)}</p>
            </div>
            <div data-panel-visual>
              <Placeholder kind="frame" label={f(`steps.${step}.mock`)} />
            </div>
          </li>
        ))}
        <li className="flow-panel" data-panel>
          <i aria-hidden className="flow-node" data-flow-node />
          <div className="flow-copy">
            <p className="font-mono text-sm text-accent-strong">
              {String(STEPS.length + 1).padStart(2, "0")}
            </p>
            <h3 className="stop-title">{f("steps.base.title")}</h3>
            <p className="stop-text">{f("steps.base.text")}</p>
            <p className="font-mono text-sm text-muted">{f("steps.base.command")}</p>
          </div>
          <div data-panel-visual>
            <FlowGraph
              labels={{
                brief: f("graph.brief"),
                research: f("graph.research"),
                screens: f("graph.screens"),
                handoff: f("graph.handoff"),
                base: f("graph.base"),
              }}
            />
          </div>
        </li>
      </ol>
    </Chapter>
  );
}
