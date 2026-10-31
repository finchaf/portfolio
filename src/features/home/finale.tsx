import { useTranslations } from "next-intl";

import { TELEGRAM_URL } from "@/lib/site";
import { ButtonLink } from "@/ui/button-link";

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
        <h2 className="finale-title font-display font-extrabold" id="finale-title">
          {t("title")}
        </h2>
        <p className="text-lg lg:text-xl">{t("text")}</p>
        <ButtonLink href={TELEGRAM_URL} tone="inverse">
          {t("write")}
        </ButtonLink>
      </div>
    </section>
  );
}
