import { useTranslations } from "next-intl";

import { PageTitle } from "@/ui/page-title";

export function HomePage() {
  const t = useTranslations("home");
  return <PageTitle>{t("title")}</PageTitle>;
}
