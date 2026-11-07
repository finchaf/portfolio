import { useTranslations } from "next-intl";

import { COMMAND, GATES, JOURNAL, RELEASES } from "@/lib/project-facts";
import { WORLDS, type WorldName } from "@/themes/worlds";

const MODES = ["light", "dark"] as const;

/** Each world's theme by the name of its page, as the header has it. */
export function useThemeNames(): Record<WorldName, string> {
  const t = useTranslations();
  return {
    home: t("home.title"),
    pora: t("pora.title"),
    flow: t("flow.title"),
    projects: t("projects.title"),
  };
}

/** Every theme in both modes, painted by the theme itself. */
export function ThemeTiles() {
  const name = useThemeNames();
  return (
    <span className="pj-tiles">
      {MODES.flatMap((mode) =>
        WORLDS.map((theme) => (
          <span className={`pj-tile pj-scheme-${mode}`} data-tint={theme} key={`${mode}-${theme}`}>
            <b>{name[theme]}</b>
            <span className="pj-tile-dots">
              <i className="bg-accent" />
              <i className="bg-ink" />
              <i className="bg-surface" />
            </span>
            <em className="bg-accent-strong" />
          </span>
        )),
      )}
    </span>
  );
}

export function GateLines() {
  return (
    <span className="pj-lines">
      <b>{COMMAND.checkShort}</b>
      {GATES.map(([name, seconds]) => (
        <span key={name}>
          <span>{name}</span>
          <em>{seconds.toFixed(1)}</em>
        </span>
      ))}
    </span>
  );
}

export function ReleaseLines() {
  return (
    <span className="pj-lines">
      <b>{COMMAND.deployShort}</b>
      {RELEASES.map(([hash, day], index) => (
        <span key={hash}>
          <span>{hash.slice(0, 7)}</span>
          <em>{index === 0 ? COMMAND.live : day}</em>
        </span>
      ))}
    </span>
  );
}

export function JournalLines() {
  return (
    <span className="pj-lines">
      <b>{COMMAND.journal}</b>
      {JOURNAL.map((file) => (
        <span key={file}>
          <span>{file.replace(/^\d+-/, "")}</span>
        </span>
      ))}
    </span>
  );
}
