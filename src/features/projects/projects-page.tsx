import { useTranslations } from "next-intl";

import { Lead } from "@/ui/lead";
import { PageTitle } from "@/ui/page-title";
import { World } from "@/ui/world";
import { WorldHero } from "@/ui/world-hero";

export function ProjectsPage() {
  const t = useTranslations("projects");
  return (
    <World name="projects">
      <WorldHero name="projects">
        <PageTitle>{t("title")}</PageTitle>
        <Lead>{t("lead")}</Lead>
      </WorldHero>
    </World>
  );
}
