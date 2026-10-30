import { useTranslations } from "next-intl";

import { Lead } from "@/ui/lead";
import { PageTitle } from "@/ui/page-title";
import { World } from "@/ui/world";

export function ProjectsPage() {
  const t = useTranslations("projects");
  return (
    <World name="projects">
      <PageTitle>{t("title")}</PageTitle>
      <Lead>{t("lead")}</Lead>
    </World>
  );
}
