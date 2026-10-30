import { useTranslations } from "next-intl";

import { GITHUB_URL, REPOSITORY_URL, TELEGRAM_URL } from "@/lib/site";
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
      <div className="mx-auto flex min-h-[70svh] w-full max-w-(--content) flex-col justify-between gap-10 px-(--gutter) pt-14 pb-[calc(var(--dock)+1.5rem)] lg:pt-20">
        <div className="flex flex-col items-start gap-6">
          <h2 className="finale-title font-display font-extrabold" id="finale-title">
            {t("title")}
          </h2>
          <p className="text-lg lg:text-xl">{t("text")}</p>
          <ButtonLink href={TELEGRAM_URL} tone="inverse">
            {t("write")}
          </ButtonLink>
        </div>
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 text-sm">
          <p>{t("copyright")}</p>
          <p className="flex gap-4">
            <a className="underline underline-offset-4" href={GITHUB_URL}>
              {t("github")}
            </a>
            <a className="underline underline-offset-4" href={REPOSITORY_URL}>
              {t("code")}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
