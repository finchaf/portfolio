import Image from "next/image";
import { useTranslations } from "next-intl";

import { DriftTitle } from "./drift-title";
import portrait from "./portrait.webp";

const ROWS = ["pora", "first", "team", "freelance"] as const;
const NOTES = ["grant", "pitch", "english"] as const;

/** How far the heading starts from its place, in pixels of the wide screen. */
const TITLE_DEPTH = 160;

/** The dates a reader in a hurry came for, and a person behind them. */
export function Experience() {
  const t = useTranslations("home.experience");
  return (
    <section
      aria-labelledby="experience-title"
      className="mx-auto grid w-full max-w-(--content) gap-10 px-(--gutter) py-10 lg:grid-cols-[3fr_2fr] lg:gap-16 lg:pt-24 lg:pb-16"
      id="experience"
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <DriftTitle
            className="font-display text-3xl font-bold lg:text-5xl"
            depth={TITLE_DEPTH}
            id="experience-title"
          >
            {t("title")}
          </DriftTitle>
          <ul>
            {ROWS.map((row) => (
              <li
                className="grid gap-x-6 border-t border-line py-3 sm:grid-cols-[6.5rem_1fr]"
                key={row}
              >
                <span className="font-mono text-sm text-muted sm:pt-0.5">
                  {t(`rows.${row}.years`)}
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold">{t(`rows.${row}.place`)}</span>
                  <span className="text-muted">{t(`rows.${row}.role`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-semibold">{t("educationTitle")}</h3>
            <ul className="flex flex-col gap-1 text-muted">
              <li>{t("educationMasters")}</li>
              <li>{t("educationBachelors")}</li>
            </ul>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-semibold">{t("notesTitle")}</h3>
            <ul className="flex flex-col gap-1 text-muted">
              {NOTES.map((note) => (
                <li key={note}>{t(note)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:pt-14">
        <Image
          alt={t("portrait")}
          className="size-32 rounded-3xl object-cover lg:size-48"
          src={portrait}
          unoptimized
        />
        <div className="flex flex-col gap-1">
          <h3 className="font-display font-semibold">{t("aboutTitle")}</h3>
          <p className="max-w-prose text-muted">{t("about")}</p>
        </div>
      </div>
    </section>
  );
}
