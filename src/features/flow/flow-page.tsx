import { useTranslations } from "next-intl";

import { PageTitle } from "@/ui/page-title";

export function FlowPage() {
  const t = useTranslations("flow");
  return <PageTitle>{t("title")}</PageTitle>;
}
