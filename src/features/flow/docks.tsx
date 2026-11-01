import {
  ArrowLeft,
  ArrowRight,
  ArrowUpNarrowWide,
  Archive,
  Bookmark,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleHelp,
  Copy,
  Ellipsis,
  FileSearch,
  FolderClosed,
  FolderPlus,
  GalleryVertical,
  GitFork,
  LayoutDashboard,
  List,
  ListTodo,
  PanelLeft,
  PanelRight,
  PencilLine,
  Plus,
  Search,
  Settings,
  SquarePen,
  Tag,
  Terminal,
  WandSparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { LinksIn, LinksOut } from "./link-icons";
import { type FolderId, FOLDERS, MAIN_NOTE } from "./notes";
import { readNote } from "./vault-source";
import type { Locale } from "@/i18n/locales";

/** A borderless icon button, with the app's tooltip under it. */
function Action({
  label,
  action,
  extra,
  children,
}: {
  label: string;
  action: string;
  extra?: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      className="clickable-icon"
      data-action={action}
      data-tip={label}
      type="button"
      {...extra}
    >
      {children}
    </button>
  );
}

function Row({ id, title, count }: { id: string; title: string; count?: string }) {
  return (
    <a className="nav-file" data-note={id} href={`#${id}`}>
      <span>{title}</span>
      {count ? <i className="nav-count">{count}</i> : null}
    </a>
  );
}

function Folder({
  folder,
  locale,
  tag,
  counts,
}: {
  folder: FolderId;
  locale: Locale;
  tag?: string;
  counts?: Record<string, string>;
}) {
  const t = useTranslations("flow.folders");
  return (
    <details className="nav-folder" open>
      <summary className="nav-folder-title">
        <ChevronRight aria-hidden className="collapse-icon" size={14} strokeWidth={2.5} />
        <span>{t(folder)}</span>
        {tag ? <i className="nav-count">{tag}</i> : null}
      </summary>
      <div className="nav-children" data-folder-id={folder}>
        {FOLDERS[folder].map((id) => (
          <Row count={counts?.[id]} id={id} key={id} title={readNote(locale, id).title} />
        ))}
      </div>
    </details>
  );
}

export function Ribbon() {
  const t = useTranslations("flow.ui");
  return (
    <nav aria-label={t("files")} className="ribbon" data-js-only="">
      <Action action="note:flow" label={t("ribbonNote")}>
        <FileSearch aria-hidden size={18} strokeWidth={1.75} />
      </Action>
      <Action action="note:graph" label={t("ribbonGraph")}>
        <GitFork aria-hidden size={18} strokeWidth={1.75} />
      </Action>
      <Action action="note:results" label={t("ribbonResults")}>
        <LayoutDashboard aria-hidden size={18} strokeWidth={1.75} />
      </Action>
      <Action action="note:state" label={t("ribbonState")}>
        <CalendarDays aria-hidden size={18} strokeWidth={1.75} />
      </Action>
      <Action action="note:checklists" label={t("ribbonChecklists")}>
        <Copy aria-hidden size={18} strokeWidth={1.75} />
      </Action>
      <Action action="focus-terminal" label={t("ribbonTerminal")}>
        <Terminal aria-hidden size={18} strokeWidth={1.75} />
      </Action>
      <Action action="note:rules" label={t("ribbonRules")}>
        <ListTodo aria-hidden size={18} strokeWidth={1.75} />
      </Action>
    </nav>
  );
}

const BOOKMARKS = ["flow", "rules", "critic", "results"];

export function LeftDock({ locale }: { locale: Locale }) {
  const t = useTranslations("flow");
  return (
    <aside aria-label={t("ui.files")} className="dock dock-left" id="dock-left">
      <div className="dock-tabs" data-js-only="">
        <div className="dock-tab-group">
          <Action action="left:files" extra={{ "data-left-tab": "files" }} label={t("ui.files")}>
            <FolderClosed aria-hidden size={18} strokeWidth={1.75} />
          </Action>
          <Action action="left:search" extra={{ "data-left-tab": "search" }} label={t("ui.search")}>
            <Search aria-hidden size={18} strokeWidth={1.75} />
          </Action>
          <Action
            action="left:bookmarks"
            extra={{ "data-left-tab": "bookmarks" }}
            label={t("ui.bookmarks")}
          >
            <Bookmark aria-hidden size={18} strokeWidth={1.75} />
          </Action>
        </div>
        <Action action="toggle-left" label={t("ui.toggleLeft")}>
          <PanelLeft aria-hidden size={18} strokeWidth={1.75} />
        </Action>
      </div>
      <Ribbon />
      <div className="sidebar">
        <div className="left-panel" data-left-panel="files">
          <div className="nav-header" data-js-only="">
            <Action action="read-only" label={t("ui.newNote")}>
              <SquarePen aria-hidden size={16} />
            </Action>
            <Action action="read-only" label={t("ui.newFolder")}>
              <FolderPlus aria-hidden size={16} />
            </Action>
            <Action action="sort" label={t("ui.sort")}>
              <ArrowUpNarrowWide aria-hidden size={16} />
            </Action>
            <Action action="reveal" label={t("ui.layout")}>
              <GalleryVertical aria-hidden size={16} />
            </Action>
            <Action action="collapse" label={t("ui.collapse")}>
              <ChevronsDownUp aria-hidden size={16} />
            </Action>
          </div>
          <nav aria-label={t("ui.notesNav")} className="nav-files" id="tree">
            <Row id={MAIN_NOTE} title={readNote(locale, MAIN_NOTE).title} />
            <Folder folder="process" locale={locale} />
            <Folder counts={{ checklists: "16", rules: "234" }} folder="quality" locale={locale} />
            <Folder folder="task" locale={locale} tag={t("folders.madeUp")} />
            <Folder folder="results" locale={locale} />
            <span data-js-only="">
              <Row id="graph" title={t("ui.graphTitle")} />
            </span>
          </nav>
        </div>
        <div className="left-panel" data-left-panel="search" hidden>
          <div className="search-input">
            <Search aria-hidden size={14} />
            <input aria-label={t("ui.search")} id="vault-search" type="search" />
          </div>
          <div className="search-results" id="vault-search-results" />
        </div>
        <div className="left-panel" data-left-panel="bookmarks" hidden>
          <nav aria-label={t("ui.bookmarks")} className="nav-files">
            {BOOKMARKS.map((id) => (
              <Row id={id} key={id} title={readNote(locale, id).title} />
            ))}
          </nav>
        </div>
        <div className="vault-profile" data-js-only="">
          <button className="vault-switcher" data-action="vault-menu" type="button">
            <ChevronsUpDown aria-hidden size={16} />
            <b>{t("ui.vaultName")}</b>
          </button>
          <span>
            <Action action="note:flow" label={t("ui.help")}>
              <CircleHelp aria-hidden size={16} />
            </Action>
            <Action action="settings-menu" label={t("ui.settings")}>
              <Settings aria-hidden size={16} />
            </Action>
          </span>
        </div>
      </div>
    </aside>
  );
}

export function RightDock() {
  const t = useTranslations("flow");
  return (
    <aside
      aria-label={t("ui.rightGraph")}
      className="dock dock-right"
      data-js-only=""
      id="dock-right"
    >
      <div className="dock-tabs">
        <div className="dock-tab-group">
          <Action
            action="right:backlinks"
            extra={{ "data-right-tab": "backlinks" }}
            label={t("ui.rightBacklinks")}
          >
            <LinksIn />
          </Action>
          <Action
            action="right:outgoing"
            extra={{ "data-right-tab": "outgoing" }}
            label={t("ui.rightOutgoing")}
          >
            <LinksOut />
          </Action>
          <Action
            action="right:tags"
            extra={{ "data-right-tab": "tags" }}
            label={t("ui.rightTags")}
          >
            <Tag aria-hidden size={18} strokeWidth={1.75} />
          </Action>
          <Action
            action="right:properties"
            extra={{ "data-right-tab": "properties" }}
            label={t("ui.rightProperties")}
          >
            <Archive aria-hidden size={18} strokeWidth={1.75} />
          </Action>
          <Action
            action="right:outline"
            extra={{ "data-right-tab": "outline" }}
            label={t("ui.rightOutline")}
          >
            <List aria-hidden size={18} strokeWidth={1.75} />
          </Action>
          <Action
            action="right:graph"
            extra={{ "data-right-tab": "graph" }}
            label={t("ui.rightGraph")}
          >
            <GitFork aria-hidden size={18} strokeWidth={1.75} />
          </Action>
        </div>
        <Action action="toggle-right" label={t("ui.toggleRight")}>
          <PanelRight aria-hidden size={18} strokeWidth={1.75} />
        </Action>
      </div>
      <div className="right-body">
        <div className="right-panel" data-right-panel="graph">
          <div className="graph-controls">
            <Action action="graph-labels" label={t("ui.graphSettings")}>
              <Settings aria-hidden size={16} />
            </Action>
            <Action action="graph-animate" label={t("ui.graphAnimate")}>
              <WandSparkles aria-hidden size={16} />
            </Action>
          </div>
          <canvas className="graph-canvas" id="graph-mini">
            {t("ui.graphLabel")}
          </canvas>
        </div>
        <div className="right-panel" data-right-panel="backlinks" hidden />
        <div className="right-panel" data-right-panel="outgoing" hidden />
        <div className="right-panel" data-right-panel="tags" hidden />
        <div className="right-panel" data-right-panel="properties" hidden />
        <div className="right-panel" data-right-panel="outline" hidden>
          <nav aria-label={t("ui.rightOutline")} className="outline" id="outline" />
        </div>
      </div>
      <div className="status-bar">
        <span>{t("terminal.statusRules")}</span>
      </div>
    </aside>
  );
}

export function TabStrip() {
  const t = useTranslations("flow.ui");
  return (
    <div className="tab-strip" data-js-only="">
      <div aria-label={t("openNotes")} className="tab-list" id="tab-list" role="group" />
      <button
        aria-label={t("newTab")}
        className="clickable-icon"
        data-action="search"
        data-tip={t("newTab")}
        type="button"
      >
        <Plus aria-hidden size={16} />
      </button>
      <span className="tab-spacer" />
      <button
        aria-label={t("tabList")}
        className="clickable-icon"
        data-action="tab-menu"
        data-tip={t("tabList")}
        type="button"
      >
        <ChevronDown aria-hidden size={16} />
      </button>
    </div>
  );
}

export function ViewHeader() {
  const t = useTranslations("flow.ui");
  return (
    <div className="view-header" data-js-only="">
      <span className="view-nav">
        <Action action="back" label={t("back")}>
          <ArrowLeft aria-hidden size={16} />
        </Action>
        <Action action="forward" label={t("forward")}>
          <ArrowRight aria-hidden size={16} />
        </Action>
      </span>
      <div className="view-crumb" id="view-crumb" />
      <span className="view-actions">
        <Action action="source" label={t("source")}>
          <PencilLine aria-hidden size={16} />
        </Action>
        <Action action="view-menu" label={t("more")}>
          <Ellipsis aria-hidden size={16} />
        </Action>
      </span>
    </div>
  );
}

/** Phone: one bar over one note. */
export function MobileBar() {
  const t = useTranslations("flow.ui");
  return (
    <div aria-label={t("noteBar")} className="mobile-bar" data-js-only="" role="navigation">
      <Action action="tree" label={t("files")}>
        <FolderClosed aria-hidden size={18} strokeWidth={1.75} />
      </Action>
      <div className="mobile-crumb" id="mobile-crumb" />
      <Action action="search" label={t("search")}>
        <Search aria-hidden size={18} strokeWidth={1.75} />
      </Action>
    </div>
  );
}
