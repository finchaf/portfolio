import { useTranslations } from "next-intl";

import { StoryScene } from "./story-scene";

/** The steps of the story in order, with the last digit of the year each one sits on. */
const STEPS = [
  { key: "university", digit: 0 },
  { key: "idea", digit: 1 },
  { key: "contract", digit: 2 },
  { key: "platforms", digit: 2 },
  { key: "restart", digit: 3 },
  { key: "now", digit: 3 },
] as const;

const YEAR_DIGITS = ["2", "3", "5", "6"];

const YEAR_START = "202";

/** The road here. Plain cards in the HTML; the scene around them turns them on a wheel. */
export function Story() {
  const t = useTranslations("home.story");
  return (
    <StoryScene digits={STEPS.map(({ digit }) => digit)}>
      <section
        aria-labelledby="story-title"
        className="story"
        id="story"
        style={{ "--steps": STEPS.length }}
      >
        <div className="story-stage">
          <div className="story-head">
            <h2 className="font-display text-2xl font-bold lg:text-4xl" id="story-title">
              {t("title")}
            </h2>
            <p className="story-hint text-sm text-muted">{t("hint")}</p>
          </div>
          <div aria-hidden className="story-year font-display font-extrabold">
            {YEAR_START}
            <span className="story-digit">
              <span data-year-digit>
                {YEAR_DIGITS.map((digit) => (
                  <span key={digit}>{digit}</span>
                ))}
              </span>
            </span>
          </div>
          <div aria-hidden className="story-wheel" data-wheel />
          <ol className="story-steps">
            {STEPS.map(({ key }, index) => (
              <li className="story-step" data-step key={key} style={{ "--i": index }}>
                <div className="flex h-full flex-col gap-2 rounded-3xl bg-page p-5 shadow-sm ring-1 ring-line lg:p-7">
                  <p className="font-mono text-sm text-accent-strong">{t(`steps.${key}.date`)}</p>
                  <h3 className="font-display text-xl leading-tight font-bold lg:text-3xl">
                    {t(`steps.${key}.title`)}
                  </h3>
                  <p className="text-muted lg:text-lg">{t(`steps.${key}.text`)}</p>
                </div>
              </li>
            ))}
          </ol>
          <div aria-hidden className="story-rail">
            <i data-story-progress />
          </div>
        </div>
      </section>
    </StoryScene>
  );
}
