import {
  AlignLeft,
  Calendar,
  CalendarDays,
  Link2,
  List,
  Plus,
  SquareCheck,
  Check,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ViewTransition } from "react";

import { folderOf, MAIN_NOTE } from "./notes";
import { EMBEDS } from "./embeds";
import { Inline, Markdown, WikiLink } from "./markdown";
import { type NoteProperty, readNote } from "./vault-source";

const WIKI_LIST = /^\[\[[^\]]+\]\](, \[\[[^\]]+\]\])+$/;
const DATE = /^(\d{2}\.\d{2}\.\d{4}|\d{1,2} \w{3} \d{4})$/;
const PLACEHOLDERS: Record<string, string> = {
  "{run}": "data-run-status",
  "{style}": "data-style-name",
  "{font}": "data-style-font",
};

function PropertyIcon({ value }: { value: string }) {
  if (value === "true" || value === "false") return <SquareCheck aria-hidden size={16} />;
  if (DATE.test(value)) return <Calendar aria-hidden size={16} />;
  if (WIKI_LIST.test(value)) return <List aria-hidden size={16} />;
  return <AlignLeft aria-hidden size={16} />;
}

function PropertyValue({ value, idle }: { value: string; idle: string }) {
  const live = PLACEHOLDERS[value];
  if (live) {
    return (
      <span className="vault-prop-live" {...{ [live]: "" }}>
        {value === "{run}" ? idle : null}
      </span>
    );
  }
  if (value === "true" || value === "false") {
    return (
      <span className="vault-checkbox" data-checked={value === "true" ? "" : undefined}>
        <Check aria-hidden size={13} strokeWidth={3} />
      </span>
    );
  }
  if (DATE.test(value)) {
    return (
      <span className="vault-prop-date">
        <CalendarDays aria-hidden size={14} />
        {value}
        <Link2 aria-hidden size={14} />
      </span>
    );
  }
  if (WIKI_LIST.test(value)) {
    return (
      <span className="vault-prop-pills">
        {value.split(", ").map((item) => {
          const [note = "", label] = item.slice(2, -2).split("|");
          return (
            <span className="vault-prop-pill" key={note}>
              <WikiLink note={note}>{label}</WikiLink>
              <X aria-hidden size={13} />
            </span>
          );
        })}
      </span>
    );
  }
  return (
    <span>
      <Inline text={value} />
    </span>
  );
}

function Properties({ items }: { items: NoteProperty[] }) {
  const t = useTranslations("flow");
  if (items.length === 0) return null;
  return (
    <section aria-label={t("ui.properties")} className="vault-metadata">
      <p className="vault-metadata-heading">{t("ui.properties")}</p>
      <dl>
        {items.map(({ key, value }) => (
          <div className="vault-metadata-property" key={key}>
            <dt>
              <PropertyIcon value={value} />
              {key}
            </dt>
            <dd>
              <PropertyValue idle={t("terminal.notStarted")} value={value} />
            </dd>
          </div>
        ))}
      </dl>
      <button className="vault-metadata-add" data-read-only="" type="button">
        <Plus aria-hidden size={16} />
        {t("ui.addProperty")}
      </button>
    </section>
  );
}

/** One note, as the app shows it in reading view, with its source beside it for the pencil. */
export function Note({ id }: { id: string }) {
  const locale = useLocale();
  const t = useTranslations("flow");
  const note = readNote(locale, id);
  const folder = folderOf(id);
  const main = id === MAIN_NOTE;
  return (
    <article
      className="vault-note"
      data-folder={folder ? t(`folders.${folder}`) : undefined}
      data-note={id}
      data-open={main ? "" : undefined}
      data-title={note.title}
      id={id}
    >
      <div className="vault-note-view">
        {main ? (
          <ViewTransition default="none" name="world-flow" share="world-name">
            <h1 className="vault-inline-title">{note.heading}</h1>
          </ViewTransition>
        ) : (
          <h2 className="vault-inline-title">{note.heading}</h2>
        )}
        <Properties items={note.properties} />
        <Markdown depth={main ? 0 : 1} embeds={EMBEDS} source={note.body} />
      </div>
      <pre className="vault-note-source" hidden>
        {note.raw}
      </pre>
    </article>
  );
}
