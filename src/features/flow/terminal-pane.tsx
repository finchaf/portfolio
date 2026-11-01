import { ChevronDown, Pause, Play, Terminal, X } from "lucide-react";
import { useTranslations } from "next-intl";

/** The pane under the note, with a tab strip like every pane in the app. */
export function TerminalPane() {
  const t = useTranslations("flow.terminal");
  return (
    <section aria-label={t("title")} className="term" data-js-only="" id="term">
      <div aria-hidden className="term-grip" data-grip="" />
      <div className="term-head">
        <div className="tab term-tab" data-on="">
          <button className="tab-go" data-action="term-toggle" type="button">
            <Terminal aria-hidden size={14} />
            {t("title")}
          </button>
          <button
            aria-label={t("collapse")}
            className="tab-x"
            data-action="term-toggle"
            type="button"
          >
            <X aria-hidden size={14} />
          </button>
        </div>
        <span className="term-now" id="term-now" />
        <span className="term-note">{t("replay")}</span>
        <button
          aria-label={t("pause")}
          className="clickable-icon"
          data-action="auto"
          id="auto-button"
          type="button"
        >
          <Pause aria-hidden data-when="on" size={16} />
          <Play aria-hidden data-when="off" size={16} />
        </button>
        <button
          aria-label={t("collapse")}
          className="clickable-icon term-fold"
          data-action="term-toggle"
          type="button"
        >
          <ChevronDown aria-hidden size={16} />
        </button>
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the log scrolls: a key must reach it. */}
      <div aria-label={t("label")} className="term-log" id="term-log" role="log" tabIndex={0} />
      <div className="term-foot">
        <div className="term-chips" id="term-chips" />
        <form className="term-line" id="term-form">
          <label className="term-ps1" htmlFor="term-in">
            {t("prompt")}
          </label>
          <span className="term-field">
            <span aria-hidden className="term-ghost" id="term-ghost" />
            <input
              aria-label={t("input")}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              enterKeyHint="send"
              id="term-in"
              spellCheck={false}
            />
          </span>
        </form>
      </div>
    </section>
  );
}
