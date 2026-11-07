import { ChevronDown, Pause, Play, Terminal, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { ScrollBar } from "@/ui/scroll-bar";

/** The pane under the note, with a tab strip like every pane in the app. */
export function TerminalPane() {
  const t = useTranslations("flow.terminal");
  return (
    <section aria-label={t("title")} className="vault-term" data-js-only="" id="term">
      <div aria-hidden className="vault-term-grip" data-grip="" />
      <div className="vault-term-head">
        <div className="vault-tab vault-term-tab" data-on="">
          <button
            aria-expanded="false"
            className="vault-tab-go"
            data-action="term-toggle"
            type="button"
          >
            <Terminal aria-hidden size={14} />
            {t("title")}
          </button>
          <button
            aria-expanded="false"
            aria-label={t("collapse")}
            className="vault-tab-x"
            data-action="term-toggle"
            type="button"
          >
            <X aria-hidden size={14} />
          </button>
        </div>
        <span className="vault-term-now" id="term-now" />
        <span className="vault-term-note">{t("replay")}</span>
        <button
          aria-label={t("pause")}
          className="vault-clickable-icon"
          data-action="auto"
          id="auto-button"
          type="button"
        >
          <Pause aria-hidden data-when="on" size={16} />
          <Play aria-hidden data-when="off" size={16} />
        </button>
        <button
          aria-expanded="false"
          aria-label={t("collapse")}
          className="vault-clickable-icon vault-term-fold"
          data-action="term-toggle"
          type="button"
        >
          <ChevronDown aria-hidden size={16} />
        </button>
      </div>
      {/* The run plays by itself, so its log keeps quiet until the reader takes the terminal. */}
      <div className="vault-term-scroll">
        <div
          aria-label={t("label")}
          aria-live="off"
          className="vault-term-log"
          id="term-log"
          role="log"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the log scrolls: a key must reach it.
          tabIndex={0}
        />
        <ScrollBar />
      </div>
      <div className="vault-term-foot">
        <div className="vault-term-chips" id="term-chips" />
        <form className="vault-term-line" id="term-form">
          <label className="vault-term-ps1" htmlFor="term-in">
            {t("prompt")}
          </label>
          <span className="vault-term-field">
            <span aria-hidden className="vault-term-ghost" id="term-ghost" />
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
