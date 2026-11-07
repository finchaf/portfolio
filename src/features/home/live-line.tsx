import { useLocale, useTranslations } from "next-intl";

import { LocalClock } from "@/ui/local-clock";

/** Whether the person is free for work, with the city and the time in it: the CV and the last call. */
export function LiveLine() {
  const hero = useTranslations("home.hero");
  const locale = useLocale();
  return (
    <p className="exp-live">
      <span aria-hidden className="exp-dot" />
      <span>{hero("status")}</span>
      <span className="exp-where">
        {hero("city")}
        <LocalClock locale={locale} />
      </span>
    </p>
  );
}
