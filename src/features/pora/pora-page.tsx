import { useTranslations } from "next-intl";

import { Lead } from "@/ui/lead";
import { World } from "@/ui/world";
import { WorldHero } from "@/ui/world-hero";

export function PoraPage() {
  const t = useTranslations("pora");
  return (
    <World name="pora">
      <WorldHero name="pora" title={t("title")}>
        <Lead>{t("lead")}</Lead>
      </WorldHero>
    </World>
  );
}
