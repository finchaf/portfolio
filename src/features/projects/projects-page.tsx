import { useTranslations } from "next-intl";

import { PageTitle } from "@/ui/page-title";

export function ProjectsPage() {
  const t = useTranslations("projects");
  return <PageTitle>{t("title")}</PageTitle>;
}
