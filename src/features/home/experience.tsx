import "./after-work.css";

import { Image } from "@/ui/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { localizedPath } from "@/i18n/localized-path";
import { GITHUB_URL, TELEGRAM_HANDLE, TELEGRAM_URL } from "@/lib/site";

import { DriftTitle } from "./drift-title";
import { LiveLine } from "./live-line";
import portrait from "./portrait.avif";

/** The rows of work, by the year each began, the latest first; a path is where the fact goes on. */
const ROWS = [
  { key: "pora" },
  { key: "team", path: "/flow" },
  { key: "freelance" },
  { key: "first" },
] as const;

const NOTES = ["grant", "pitch", "english"] as const;

/** How far the heading starts from its place, in pixels of the wide screen. */
const TITLE_DEPTH = 160;

interface Line {
  years: string;
  place: string;
  role: string;
  fact?: string;
  more?: { href: string; label: string };
}

/** One line of the CV: the years on the margin, the place, the role, and a fact with its date. */
function CvRow({ line }: { line: Line }) {
  return (
    <li className="exp-row">
      <span className="exp-years">{line.years}</span>
      <span className="exp-what">
        <span className="exp-place">{line.place}</span>
        <span className="exp-role">{line.role}</span>
        {line.fact ? (
          <span className="exp-fact">
            {line.fact}
            {line.more ? (
              <>
                {" "}
                <Link className="exp-more" href={line.more.href}>
                  {line.more.label}
                </Link>
              </>
            ) : null}
          </span>
        ) : null}
      </span>
    </li>
  );
}

/**
 * A short CV: on the left the person, standing on two rules, held while the rows pass on the right.
 * The portrait has no ground of its own; its shoulders meet the frame only in its lowest tenth, and
 * the rules keep that part out of sight.
 */
export function Experience() {
  const t = useTranslations("home.experience");
  const hero = useTranslations("home.hero");
  const cv = useTranslations("home.cv");
  const locale = useLocale();
  const rows: Line[] = ROWS.map((row) => ({
    years: t(`rows.${row.key}.years`),
    place: t(`rows.${row.key}.place`),
    role: t(`rows.${row.key}.role`),
    fact: t(`rows.${row.key}.fact`),
    more:
      "path" in row
        ? { href: localizedPath(locale, row.path), label: t("rows.team.link") }
        : undefined,
  }));
  const education: Line[] = [
    {
      years: t("education.masters.years"),
      place: t("education.masters.place"),
      role: t("education.masters.role"),
    },
    {
      years: t("education.bachelors.years"),
      place: t("education.bachelors.place"),
      role: t("education.bachelors.role"),
      fact: t("education.bachelors.fact"),
      more: {
        href: localizedPath(locale, "/projects/latex"),
        label: t("education.bachelors.link"),
      },
    },
  ];
  return (
    <section aria-labelledby="experience-title" className="exp" id="experience">
      <div className="exp-in">
        <DriftTitle className="exp-title" depth={TITLE_DEPTH} id="experience-title">
          {t("title")}
        </DriftTitle>
        <aside className="exp-profile">
          <figure className="exp-photo">
            <Image
              alt={t("portrait")}
              className="exp-portrait"
              draggable={false}
              sizes="(min-width: 64rem) 22rem, 20rem"
              src={portrait}
            />
          </figure>
          <p className="exp-name">{hero("name")}</p>
          <p className="exp-role-line">
            <span>{hero("role")}</span>
            <span>{hero("roleNote")}</span>
          </p>
          <LiveLine />
          <p className="exp-about">{t("about")}</p>
          <p className="exp-links">
            <a
              className="control-button control-primary control-small"
              download={cv("file")}
              href={`/cv/${locale}.pdf`}
              type="application/pdf"
            >
              {cv("download")}
            </a>
            <a className="control-link" href={TELEGRAM_URL}>
              {TELEGRAM_HANDLE}
            </a>
            <a className="control-link" href={GITHUB_URL}>
              {hero("github")}
            </a>
          </p>
        </aside>

        <div className="exp-main">
          <ul className="exp-rows">
            {rows.map((line) => (
              <CvRow key={line.place} line={line} />
            ))}
          </ul>
          <h3 className="exp-sub">{t("educationTitle")}</h3>
          <ul className="exp-rows">
            {education.map((line) => (
              <CvRow key={line.place} line={line} />
            ))}
          </ul>
          <div className="exp-pair">
            <div>
              <h3 className="exp-sub">{t("notesTitle")}</h3>
              <ul className="exp-notes">
                {NOTES.map((note) => (
                  <li key={note}>{t(note)}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="exp-sub">{t("toolsTitle")}</h3>
              <ul className="exp-tools">
                {t("tools")
                  .split(", ")
                  .map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
