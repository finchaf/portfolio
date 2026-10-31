import { useTranslations } from "next-intl";

import firstScreen from "./photos/first-screen.webp";
import firstSite from "./photos/first-site.webp";
import portrait from "./photos/portrait.webp";
import { CHAPTERS, RIBBON_SPANS, SPANS } from "./story-data";
import { FrameWall, LaunchChart, NightLog } from "./story-figures";
import {
  StoryChapter,
  StoryCol,
  StoryHead,
  StoryPhoto,
  StoryQuote,
  StoryText,
} from "./story-parts";
import { StoryScene } from "./story-scene";

/** Heights of the short ticks around the needle, in rem: a ripple where the reader stands. */
const RIPPLE = [0.5, 0.75, 1, 1.35, 1.75, 1.35, 1, 0.75, 0.5];

function Ruler() {
  const t = useTranslations("home.story");
  return (
    <div aria-hidden className="story-ruler">
      <div className="story-ticks" data-story-ticks />
      <div className="story-needle">
        {RIPPLE.map((height, index) => (
          <i key={index} style={{ "--h": height, "--i": index - (RIPPLE.length - 1) / 2 }} />
        ))}
      </div>
      <div className="story-marks">
        {CHAPTERS.map((chapter) => (
          <span data-story-mark key={chapter}>
            {t(`${chapter}.mark`)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Omsk() {
  const t = useTranslations("home.story.omsk");
  return (
    <StoryChapter id="omsk">
      <StoryCol weight={1}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("school")}</StoryText>
        <StoryText>{t("game")}</StoryText>
      </StoryCol>
      <StoryCol at="middle" weight={1.15}>
        <FrameWall />
      </StoryCol>
      <StoryCol at="bottom" weight={0.95}>
        <StoryPhoto label={t("photo")} size={21} tilt={-2.5} />
        <StoryQuote>{t("quote")}</StoryQuote>
        <StoryText>{t("after")}</StoryText>
      </StoryCol>
    </StoryChapter>
  );
}

function University() {
  const t = useTranslations("home.story.university");
  return (
    <StoryChapter id="university">
      <StoryCol weight={1}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("choice")}</StoryText>
        <StoryText>{t("roles")}</StoryText>
      </StoryCol>
      <StoryCol at="middle" weight={0.9}>
        <StoryPhoto label={t("photo")} ratio={3 / 4} size={20} tilt={1.5} />
      </StoryCol>
      <StoryCol at="bottom" weight={1.1}>
        <StoryQuote drift={60}>{t("quote")}</StoryQuote>
        <StoryText>{t("idea")}</StoryText>
        <StoryPhoto label={t("friends")} ratio={3 / 2} size={19} tilt={-1.5} />
      </StoryCol>
    </StoryChapter>
  );
}

function Build() {
  const t = useTranslations("home.story.build");
  return (
    <StoryChapter id="build">
      <StoryCol weight={1.1}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("start")}</StoryText>
        <StoryText>{t("learn")}</StoryText>
      </StoryCol>
      <StoryCol at="middle" weight={0.75}>
        <StoryPhoto
          drift={90}
          label={t("screen")}
          ratio={512 / 1047}
          size={15}
          src={firstScreen}
          tilt={2}
        />
      </StoryCol>
      <StoryCol at="bottom" weight={1}>
        <StoryPhoto label={t("photo")} ratio={1} size={15} tilt={-2} />
        <StoryQuote>{t("quote")}</StoryQuote>
        <StoryText>{t("polish")}</StoryText>
      </StoryCol>
    </StoryChapter>
  );
}

function Launch() {
  const t = useTranslations("home.story.launch");
  return (
    <StoryChapter id="launch">
      <StoryCol weight={0.9}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("post")}</StoryText>
        <StoryQuote>{t("quote")}</StoryQuote>
      </StoryCol>
      <StoryCol at="middle" spot weight={1.3}>
        <p className="story-rank" data-reveal>
          <span className="story-rank-number font-display">{t("rank")}</span>
          <span className="story-rank-label">{t("rankLabel")}</span>
        </p>
        <LaunchChart />
      </StoryCol>
      <StoryCol at="bottom" weight={0.8}>
        <StoryPhoto label={t("site")} ratio={640 / 600} size={21} src={firstSite} tilt={-1.5} />
        <StoryText>{t("next")}</StoryText>
      </StoryCol>
    </StoryChapter>
  );
}

function Fork() {
  const t = useTranslations("home.story.fork");
  return (
    <StoryChapter id="fork">
      <StoryCol at="middle">
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("question")}</StoryText>
        <StoryQuote drift={60}>{t("quote")}</StoryQuote>
        <StoryText>{t("answer")}</StoryText>
      </StoryCol>
    </StoryChapter>
  );
}

function Night() {
  const t = useTranslations("home.story.night");
  return (
    <StoryChapter dark id="night">
      <StoryCol weight={1}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("letter")}</StoryText>
        <StoryText>{t("need")}</StoryText>
      </StoryCol>
      <StoryCol at="middle" weight={1.15}>
        <StoryQuote drift={60}>{t("quote")}</StoryQuote>
        <NightLog />
      </StoryCol>
      <StoryCol at="bottom" weight={1}>
        <StoryPhoto drift={80} label={t("photo")} ratio={4 / 5} size={18} tilt={1.5} />
        <StoryText>{t("wait")}</StoryText>
        <StoryText>
          <b>{t("grant")}</b> {t("move")}
        </StoryText>
      </StoryCol>
    </StoryChapter>
  );
}

function Moscow() {
  const t = useTranslations("home.story.moscow");
  return (
    <StoryChapter id="moscow">
      <StoryCol weight={1}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("job")}</StoryText>
        <StoryText>{t("agents")}</StoryText>
      </StoryCol>
      <StoryCol at="bottom" weight={1.05}>
        <StoryPhoto label={t("photo")} ratio={3 / 2} size={21} tilt={-1.5} />
        <StoryQuote>{t("quote")}</StoryQuote>
        <StoryText>{t("prompts")}</StoryText>
      </StoryCol>
    </StoryChapter>
  );
}

function Now() {
  const t = useTranslations("home.story.now");
  return (
    <StoryChapter id="now">
      <StoryCol weight={1}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("first")}</StoryText>
        <p className="story-caption" data-reveal>
          {t("firstSource")}
        </p>
        <StoryText>{t("next")}</StoryText>
        <StoryQuote drift={30}>{t("quote")}</StoryQuote>
      </StoryCol>
      <StoryCol at="middle" weight={0.9}>
        <StoryPhoto drift={30} label={t("portrait")} ratio={1} size={25} src={portrait} />
      </StoryCol>
    </StoryChapter>
  );
}

/**
 * The road here, in the HTML in order. With a script on a wide screen it becomes a ribbon the
 * scroll carries sideways; on a phone, with reduced motion and without a script, plain chapters.
 */
export function Story() {
  const t = useTranslations("home.story");
  return (
    <StoryScene>
      <section
        aria-labelledby="story-title"
        className="story"
        id="story"
        style={{ "--spans": RIBBON_SPANS }}
      >
        <div className="story-stage" data-under>
          <div aria-hidden className="story-grain" />
          <Ruler />
          <div className="story-track" data-story-track>
            <div className="story-open" style={{ "--span": SPANS.open }}>
              <h2 className="story-title font-display" id="story-title">
                {t("title")}
              </h2>
              <p className="story-text">{t("lead")}</p>
              <p className="story-hint text-sm text-muted">{t("hint")}</p>
            </div>
            <ol className="story-chapters">
              <Omsk />
              <University />
              <Build />
              <Launch />
              <Fork />
              <Night />
              <Moscow />
              <Now />
            </ol>
          </div>
        </div>
      </section>
    </StoryScene>
  );
}
