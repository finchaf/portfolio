import "@/themes/flow-looks.css";
import "@/ui/app-screens.css";
import "./flow.css";

import { useLocale, useMessages, useTranslations } from "next-intl";

import { LOCALES } from "@/i18n/locales";
import { localizedPath } from "@/i18n/localized-path";
import { PAGE_PATHS, PAGES } from "@/lib/pages";
import { ScrollBar } from "@/ui/scroll-bar";
import { World } from "@/ui/world";

import { LeftDock, MobileBar, RightDock, TabStrip, ViewHeader } from "./docks";
import type { VaultStrings } from "./engine/strings";
import { FlowVault } from "./flow-vault";
import { Note } from "./note";
import { NOTE_IDS } from "./notes";
import { TerminalPane } from "./terminal-pane";

/**
 * The page is the vault: a tree, one note at a time, the links beside it and a terminal under it.
 * Every note is in the HTML, so without a script they stand one after another; the page scrolls as
 * a page, and the panes hold on with `sticky`.
 */
export function FlowPage() {
  const locale = useLocale();
  const t = useTranslations();
  const messages = useMessages() as unknown as { flow: Omit<VaultStrings, "pages" | "other"> };
  const other = LOCALES.find((each) => each !== locale) ?? locale;
  const pages = PAGE_PATHS.filter((path) => path !== "/flow").map((path) => ({
    label: path === "" ? t("home.title") : t(`${PAGES[path]}.title`),
    href: localizedPath(locale, path),
  }));
  return (
    <World name="flow">
      <div className="vault" data-capsule-flat="" id="vault">
        <div aria-hidden className="vault-titlebar" />
        <MobileBar />
        <div className="vault-workspace">
          <LeftDock locale={locale} />
          <div className="vault-root-split" id="root-split">
            <TabStrip />
            <ViewHeader />
            <div className="vault-notes" id="notes">
              {NOTE_IDS.map((id) => (
                <Note id={id} key={id} />
              ))}
              <article
                className="vault-note vault-graph-note"
                data-js-only=""
                data-note="graph"
                id="graph"
              >
                <canvas className="vault-graph-canvas" id="graph-full">
                  {t("flow.ui.graphLabel")}
                </canvas>
              </article>
            </div>
            <i aria-hidden className="vault-scroll-thumb" data-js-only="" id="scroll-thumb" />
            <TerminalPane />
          </div>
          <RightDock />
        </div>
      </div>
      <div className="vault-popover" hidden id="preview" />
      <div
        aria-label={t("flow.ui.search")}
        aria-modal="true"
        className="vault-prompt-shade"
        hidden
        id="prompt"
        role="dialog"
      >
        <div className="vault-prompt">
          <input
            aria-autocomplete="list"
            aria-controls="prompt-list"
            aria-expanded="true"
            aria-label={t("flow.ui.search")}
            id="prompt-input"
            role="combobox"
          />
          <div className="vault-prompt-scroll">
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role -- the input's list of options, as a combobox has it. */}
            <ul aria-label={t("flow.ui.search")} id="prompt-list" role="listbox" />
            <ScrollBar />
          </div>
          <p className="vault-prompt-hint">{t("flow.ui.searchHint")}</p>
        </div>
      </div>
      <div className="vault-scrim" hidden id="scrim" />
      <div aria-live="polite" className="vault-notices" id="notices" />
      <FlowVault
        strings={{
          ui: messages.flow.ui,
          terminal: messages.flow.terminal,
          board: messages.flow.board,
          checklists: messages.flow.checklists,
          pages,
          other: {
            label: t("flow.ui.languageOther"),
            locale: other,
          },
        }}
      />
    </World>
  );
}
