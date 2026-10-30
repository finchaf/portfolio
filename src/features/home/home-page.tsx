import { useTranslations } from "next-intl";

import { Lead } from "@/ui/lead";
import { PageTitle } from "@/ui/page-title";
import { World } from "@/ui/world";

export function HomePage() {
  const t = useTranslations("home");
  return (
    <World name="home">
      <PageTitle>{t("title")}</PageTitle>
      <Lead>{t("lead")}</Lead>
    </World>
  );
}
