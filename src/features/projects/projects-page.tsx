import { useTranslations } from "next-intl";

import { Lead } from "@/ui/lead";
import { World } from "@/ui/world";
import { WorldHero } from "@/ui/world-hero";

export function ProjectsPage() {
  const t = useTranslations("projects");
  return (
    <World name="projects">
      <WorldHero name="projects" title={t("title")}>
        <Lead>{t("lead")}</Lead>
      </WorldHero>
    </World>
  );
}
