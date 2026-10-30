import { useTranslations } from "next-intl";

import { Lead } from "@/ui/lead";
import { PageTitle } from "@/ui/page-title";
import { World } from "@/ui/world";
import { WorldHero } from "@/ui/world-hero";

export function PoraPage() {
  const t = useTranslations("pora");
  return (
    <World name="pora">
      <WorldHero name="pora">
        <PageTitle>{t("title")}</PageTitle>
        <Lead>{t("lead")}</Lead>
      </WorldHero>
    </World>
  );
}
