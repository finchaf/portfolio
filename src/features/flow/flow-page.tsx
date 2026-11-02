import "@/themes/flow-looks.css";
import "./flow.css";
import "./app-screens.css";

import { useLocale, useMessages, useTranslations } from "next-intl";

import { LOCALES } from "@/i18n/locales";
import { localizedPath } from "@/i18n/localized-path";
import { PAGE_PATHS, PAGES } from "@/lib/pages";
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
    <World bleed name="flow">
      <div className="vault" data-capsule-flat="" id="vault">
        <div aria-hidden className="vault-titlebar" />
        <MobileBar />
        <div className="workspace">
          <LeftDock locale={locale} />
          <div className="root-split" id="root-split">
            <TabStrip />
            <ViewHeader />
            <div className="notes" id="notes">
              {NOTE_IDS.map((id) => (
                <Note id={id} key={id} />
              ))}
              <article className="note graph-note" data-js-only="" data-note="graph" id="graph">
                <canvas className="graph-canvas" id="graph-full">
                  {t("flow.ui.graphLabel")}
                </canvas>
              </article>
            </div>
            <i aria-hidden className="scroll-thumb" data-js-only="" id="scroll-thumb" />
            <TerminalPane />
          </div>
          <RightDock />
        </div>
      </div>
      <div className="popover" hidden id="preview" />
      <div
        aria-label={t("flow.ui.search")}
        aria-modal="true"
        className="prompt-shade"
        hidden
        id="prompt"
        role="dialog"
      >
        <div className="prompt">
          <input aria-label={t("flow.ui.search")} id="prompt-input" />
          <ul id="prompt-list" />
          <p className="prompt-hint">{t("flow.ui.searchHint")}</p>
        </div>
      </div>
      <div className="scrim" hidden id="scrim" />
      <div aria-live="polite" className="notices" id="notices" />
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
