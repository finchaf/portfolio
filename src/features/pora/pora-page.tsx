import { useTranslations } from "next-intl";

import { PageTitle } from "@/ui/page-title";

export function PoraPage() {
  const t = useTranslations("pora");
  return <PageTitle>{t("title")}</PageTitle>;
}
