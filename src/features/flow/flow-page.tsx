import { useTranslations } from "next-intl";

import { Lead } from "@/ui/lead";
import { PageTitle } from "@/ui/page-title";
import { World } from "@/ui/world";
import { WorldHero } from "@/ui/world-hero";

export function FlowPage() {
  const t = useTranslations("flow");
  return (
    <World name="flow">
      <WorldHero name="flow">
        <PageTitle>{t("title")}</PageTitle>
        <Lead>{t("lead")}</Lead>
      </WorldHero>
    </World>
  );
}
