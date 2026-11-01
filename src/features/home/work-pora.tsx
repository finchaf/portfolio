import { useTranslations } from "next-intl";

import { Chapter, Stop } from "./chapter";
import { MiniWeek } from "./mini-week";
import { Placeholder } from "./placeholder";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"] as const;
const TICKS = ["intro", "service", "apps", "editor", "origin"] as const;
const STORES = ["appStore", "googlePlay", "ruStore"] as const;

/** «Пора на пару», down its stops: the product, the service, the apps, the editor, where it began. */
export function WorkPora() {
  const t = useTranslations("home.work");
  const p = useTranslations("home.work.pora");
  const lessons = {
    math: p("week.lessons.math"),
    base: p("week.lessons.base"),
    code: p("week.lessons.code"),
  };
  return (
    <Chapter
      axis="y"
      index={1}
      name={p("name")}
      next={{ href: "#work-flow", label: t("next.flow") }}
      open={t("open")}
      path="/poranaparu"
      ticks={TICKS.map((tick) => p(`ticks.${tick}`))}
      world="pora"
    >
      <ol className="chapter-stops">
        <Stop
          copy={
            <>
              <p className="font-mono text-sm text-muted">{p("label")}</p>
              <h3 className="stop-title stop-title-large">{p("name")}</h3>
              <p className="w-fit rounded-full bg-raised px-2.5 py-0.5 text-xs text-ink">
                {p("stage")}
              </p>
              <p className="stop-text">{p("text")}</p>
              <p className="text-sm text-muted">{p("role")}</p>
            </>
          }
          visual={
            <div className="devices">
              <Placeholder kind="browser" label={p("mock.site")} />
              <Placeholder kind="phone" label={p("mock.iphone")} />
            </div>
          }
        />
        <Stop
          copy={
            <>
              <h3 className="stop-title">{p("service.title")}</h3>
              <p className="stop-text">{p("service.text")}</p>
            </>
          }
          visual={<Placeholder kind="browser" label={p("mock.service")} />}
        />
        <Stop
          copy={
            <>
              <h3 className="stop-title">{p("apps.title")}</h3>
              <p className="stop-text">{p("apps.text")}</p>
            </>
          }
          visual={
            <div className="devices devices-pair">
              <Placeholder kind="phone" label={p("mock.iphone")} />
              <Placeholder kind="phone" label={p("mock.android")} />
            </div>
          }
        />
        <Stop
          copy={
            <>
              <h3 className="stop-title">{p("editor.title")}</h3>
              <p className="stop-text">{p("editor.text")}</p>
            </>
          }
          visual={
            <div className="rounded-3xl bg-surface p-4 ring-1 ring-line lg:p-6">
              <MiniWeek
                clear={p("week.clear")}
                conflict={p("week.conflict")}
                days={DAY_KEYS.map((day) => p(`week.days.${day}`))}
                lessons={lessons}
                moveLabel={{
                  math: p("week.move", { lesson: lessons.math }),
                  base: p("week.move", { lesson: lessons.base }),
                  code: p("week.move", { lesson: lessons.code }),
                }}
              />
            </div>
          }
        />
        <Stop
          copy={
            <>
              <h3 className="stop-title">{p("origin.title")}</h3>
              <p className="stop-text">{p("origin.text")}</p>
              <p
                className="w-fit rounded-md border border-dashed border-warning px-2 py-0.5 text-sm"
                data-placeholder
              >
                {p("origin.proof")}
              </p>
              <p className="flex flex-wrap gap-x-3 text-sm">
                <span className="text-muted">{p("origin.stores")}</span>
                {STORES.map((store) => (
                  <a className="underline underline-offset-4" href={p(`${store}Url`)} key={store}>
                    {p(store)}
                  </a>
                ))}
              </p>
            </>
          }
          visual={
            <div className="devices devices-one">
              <Placeholder kind="phone" label={p("mock.first")} />
            </div>
          }
        />
      </ol>
    </Chapter>
  );
}
