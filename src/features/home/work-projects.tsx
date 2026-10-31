import { useTranslations } from "next-intl";

import { REPOSITORY_URL, THESIS_URL } from "@/lib/site";

import { Chapter, Stop } from "./chapter";
import { Placeholder } from "./placeholder";

const TICKS = ["intro", "site", "thesis"] as const;
const PROJECTS = [
  { key: "site", href: REPOSITORY_URL },
  { key: "thesis", href: THESIS_URL },
] as const;

/** The rest of the work, one screen for each project: frames land on a canvas and stay there. */
export function WorkProjects() {
  const t = useTranslations("home.work");
  const p = useTranslations("home.work.projects");
  return (
    <Chapter
      axis="y"
      index={3}
      name={p("name")}
      next={{ href: "#experience", label: t("next.experience") }}
      open={t("open")}
      path="/projects"
      ticks={TICKS.map((tick) => p(`ticks.${tick}`))}
      world="projects"
    >
      <ol className="chapter-stops">
        <Stop
          copy={
            <>
              <p className="font-mono text-sm text-muted">{p("label")}</p>
              <h3 className="stop-title stop-title-large">{p("name")}</h3>
              <p className="stop-text">{p("text")}</p>
            </>
          }
          visual={null}
        />
        {PROJECTS.map(({ key, href }) => (
          <Stop
            copy={
              <>
                <p className="flex w-fit items-center gap-2 rounded-full bg-raised px-2.5 py-0.5 text-xs text-ink">
                  <span aria-hidden className="size-1.5 rounded-full bg-success" />
                  {p(`${key}.state`)}
                </p>
                <h3 className="stop-title">{p(`${key}.title`)}</h3>
                <p className="stop-text">{p(`${key}.text`)}</p>
                <a className="w-fit text-sm underline underline-offset-4" href={href}>
                  {p(`${key}.link`)}
                </a>
              </>
            }
            key={key}
            visual={
              <figure className="project-frame">
                <figcaption className="font-mono text-xs text-muted">{p(`${key}.file`)}</figcaption>
                <Placeholder kind="browser" label={p(`${key}.mock`)} />
              </figure>
            }
          />
        ))}
      </ol>
    </Chapter>
  );
}
