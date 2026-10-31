import { useTranslations } from "next-intl";

import { WorkFlow } from "./work-flow";
import { WorkPora } from "./work-pora";
import { WorkProjects } from "./work-projects";
import { WorkScene } from "./work-scene";

/** Three works, each on the whole screen and in its own theme: down, sideways, down again. */
export function Work() {
  const t = useTranslations("home.work");
  return (
    <section aria-labelledby="work-title" className="work" id="work">
      <h2 className="sr-only" id="work-title">
        {t("title")}
      </h2>
      <WorkScene>
        <WorkPora />
        <WorkFlow />
        <WorkProjects />
      </WorkScene>
    </section>
  );
}
