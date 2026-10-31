import { useTranslations } from "next-intl";

import cafe from "./photos/cafe.webp";
import code from "./photos/code.webp";
import eve from "./photos/eve.webp";
import firstRoom from "./photos/first-room.webp";
import firstScreen from "./photos/first-screen.webp";
import forest from "./photos/forest.webp";
import hall from "./photos/hall.webp";
import lift from "./photos/lift.webp";
import mirror from "./photos/mirror.webp";
import msu from "./photos/msu.webp";
import comments from "./photos/omsk-comments.webp";
import plane from "./photos/plane.webp";
import room from "./photos/room.webp";
import stage from "./photos/stage.webp";
import sunset from "./photos/sunset.webp";
import { StoryCollage } from "./story-collage";
import { CHAPTERS, RIBBON_BLEEDS, RIBBON_HOLD, RIBBON_SPANS, SPANS } from "./story-data";
import { LaunchSheet, NightLog, StoryBranches } from "./story-figures";
import { StoryMenus } from "./story-menus";
import {
  StoryBleed,
  StoryChapter,
  StoryCol,
  StoryHead,
  StoryPhoto,
  StoryPile,
  StoryQuote,
  StoryText,
} from "./story-parts";
import { StoryScene } from "./story-scene";

function Ruler() {
  const t = useTranslations("home.story");
  return (
    <div aria-hidden className="story-ruler" data-story-paper>
      <canvas data-story-canvas />
      <div className="story-marks" data-story-marks>
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
      <StoryCol at="middle" weight={2}>
        <StoryMenus />
        <StoryQuote>{t("quote")}</StoryQuote>
        <StoryText>{t("after")}</StoryText>
      </StoryCol>
      <StoryCol at="middle" weight={1}>
        <StoryPhoto
          caption={t("commentsCaption")}
          drift={30}
          label={t("comments")}
          size={30}
          src={comments}
        />
      </StoryCol>
    </StoryChapter>
  );
}

function University() {
  const t = useTranslations("home.story.university");
  const photos = useTranslations("home.story.photos");
  return (
    <StoryChapter id="university">
      <StoryCol weight={1}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("choice")}</StoryText>
        <StoryText>{t("roles")}</StoryText>
      </StoryCol>
      <StoryCol at="middle" weight={1.15}>
        <StoryPhoto label={photos("forest")} size={32} src={forest} tilt={1.5} />
      </StoryCol>
      <StoryCol at="bottom" weight={1.1}>
        <StoryPhoto drift={90} label={photos("lift")} size={24} src={lift} tilt={-2} />
        <StoryQuote depth={60}>{t("quote")}</StoryQuote>
        <StoryText>{t("idea")}</StoryText>
      </StoryCol>
    </StoryChapter>
  );
}

function Build() {
  const t = useTranslations("home.story.build");
  const photos = useTranslations("home.story.photos");
  return (
    <StoryChapter id="build">
      <StoryCol weight={1.1}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("start")}</StoryText>
        <StoryText>{t("learn")}</StoryText>
      </StoryCol>
      <StoryCol at="middle" weight={0.75}>
        <StoryPhoto drift={90} label={t("screen")} size={15} src={firstScreen} tilt={2} />
      </StoryCol>
      <StoryCol at="bottom" weight={1.1}>
        <StoryPhoto
          caption={t("codeCaption")}
          label={photos("code")}
          size={25}
          src={code}
          tilt={-1.5}
        />
        <StoryQuote>{t("quote")}</StoryQuote>
        <StoryText>{t("polish")}</StoryText>
      </StoryCol>
    </StoryChapter>
  );
}

function Launch() {
  const t = useTranslations("home.story.launch");
  const photos = useTranslations("home.story.photos");
  return (
    <StoryChapter id="launch">
      <StoryCol weight={0.9}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("post")}</StoryText>
        <StoryQuote>{t("quote")}</StoryQuote>
      </StoryCol>
      <StoryCol at="middle" spot weight={1.3}>
        <LaunchSheet />
      </StoryCol>
      <StoryCol at="bottom" weight={0.8}>
        <StoryPile>
          <StoryPhoto
            caption={t("eveCaption")}
            label={photos("eve")}
            size={19}
            src={eve}
            tilt={-1.5}
          />
          <StoryPhoto
            caption={t("stageCaption")}
            drift={80}
            label={photos("stage")}
            size={13}
            src={stage}
            tilt={2}
          />
        </StoryPile>
        <StoryText>{t("next")}</StoryText>
      </StoryCol>
    </StoryChapter>
  );
}

function Fork() {
  const t = useTranslations("home.story.fork");
  const photos = useTranslations("home.story.photos");
  return (
    <StoryChapter id="fork">
      <StoryCol at="middle" weight={1.15}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("question")}</StoryText>
        <StoryQuote cross depth={55}>
          {t("quote")}
        </StoryQuote>
        <StoryText>{t("answer")}</StoryText>
      </StoryCol>
      <StoryCol at="bottom" weight={1}>
        <StoryPhoto label={photos("cafe")} size={30} src={cafe} tilt={-1.5} />
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
        <StoryQuote depth={60}>{t("quote")}</StoryQuote>
        <NightLog />
      </StoryCol>
      <StoryCol at="bottom" weight={0.9}>
        <StoryText>{t("wait")}</StoryText>
        <StoryQuote depth={55}>{t("grant")}</StoryQuote>
        <StoryText>{t("move")}</StoryText>
      </StoryCol>
    </StoryChapter>
  );
}

function Rent() {
  const t = useTranslations("home.story.rent");
  const photos = useTranslations("home.story.photos");
  return (
    <StoryChapter id="rent">
      <StoryCol at="bottom">
        <StoryQuote cross depth={60}>
          {t("quote")}
        </StoryQuote>
      </StoryCol>
      <div className="story-run" data-bare-run>
        <StoryBleed label={photos("plane")} src={plane} />
        <StoryBleed label={photos("room")} src={room} />
        <StoryBleed label={photos("msu")} src={msu} />
      </div>
    </StoryChapter>
  );
}

function Moscow() {
  const t = useTranslations("home.story.moscow");
  const photos = useTranslations("home.story.photos");
  return (
    <StoryChapter id="moscow">
      <StoryCol weight={1}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("job")}</StoryText>
        <StoryText>{t("agents")}</StoryText>
        <StoryPhoto drift={40} label={photos("firstRoom")} size={18} src={firstRoom} tilt={2} />
      </StoryCol>
      <StoryCol at="middle" weight={0.8}>
        <StoryPhoto drift={80} label={photos("mirror")} size={25} src={mirror} tilt={-1.5} />
      </StoryCol>
      <StoryCol at="bottom" weight={1.25}>
        <StoryPile>
          <StoryPhoto label={photos("sunset")} size={31} src={sunset} tilt={1} />
          <StoryPhoto drift={90} label={photos("hall")} size={17} src={hall} tilt={-2.5} />
        </StoryPile>
        <StoryQuote>{t("quote")}</StoryQuote>
        <StoryText>{t("prompts")}</StoryText>
      </StoryCol>
    </StoryChapter>
  );
}

function Now() {
  const t = useTranslations("home.story.now");
  return (
    <StoryChapter id="now" settles>
      <StoryCol>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryQuote depth={40}>{t("quote")}</StoryQuote>
      </StoryCol>
      <StoryBranches />
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
        style={{ "--spans": RIBBON_SPANS, "--bleeds": RIBBON_BLEEDS, "--hold": RIBBON_HOLD }}
      >
        <div className="story-stage" data-under>
          <div aria-hidden className="story-paper" data-story-paper />
          <div aria-hidden className="story-grain" data-story-paper />
          <Ruler />
          <div className="story-track" data-story-track>
            <div className="story-open" style={{ "--span": SPANS.open }}>
              <div className="story-open-copy">
                <h2 className="story-title font-display" data-title id="story-title">
                  {t("title")}
                </h2>
                <p className="story-text">{t("lead")}</p>
                <p className="story-hint text-sm text-muted">{t("hint")}</p>
              </div>
              <StoryCollage />
            </div>
            <ol className="story-chapters">
              <Omsk />
              <University />
              <Build />
              <Launch />
              <Fork />
              <Night />
              <Rent />
              <Moscow />
              <Now />
            </ol>
          </div>
        </div>
      </section>
    </StoryScene>
  );
}
