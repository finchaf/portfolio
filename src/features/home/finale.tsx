import { useTranslations } from "next-intl";

import { TELEGRAM_URL } from "@/lib/site";
import { ButtonLink } from "@/ui/button-link";

import { DriftTitle } from "./drift-title";

/** How far the two lines of the last call start apart, in pixels of the wide screen. */
const TITLE_DEPTH = 240;

/** The last screen: one call, the size of the first one. */
export function Finale() {
  const t = useTranslations("home.finale");
  return (
    <section
      aria-labelledby="finale-title"
      className="bg-accent-strong text-on-accent"
      id="contact"
    >
      <div className="mx-auto flex min-h-[60svh] w-full max-w-(--content) flex-col items-start justify-center gap-6 px-(--gutter) py-14 lg:py-20">
        <DriftTitle
          className="finale-title font-display font-extrabold"
          cross
          depth={TITLE_DEPTH}
          id="finale-title"
        >
          {t("title")}
        </DriftTitle>
        <p className="text-lg lg:text-xl">{t("text")}</p>
        <ButtonLink data-write href={TELEGRAM_URL} tone="inverse">
          {t("write")}
        </ButtonLink>
      </div>
    </section>
  );
}
