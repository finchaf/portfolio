import { useTranslations } from "next-intl";

/** The first stop of the keyboard: straight to the page, past the header. */
export function SkipLink() {
  const t = useTranslations("shell");
  return (
    <a
      className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:bg-white focus:px-3 focus:py-2"
      href="#content"
    >
      {t("skipToContent")}
    </a>
  );
}
