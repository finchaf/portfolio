import { useTranslations } from "next-intl";

import cafe from "./photos/cafe.webp";
import code from "./photos/code.webp";
import corridor from "./photos/corridor.webp";
import eve from "./photos/eve.webp";
import firstRoom from "./photos/first-room.webp";
import firstScreen from "./photos/first-screen.webp";
import forest from "./photos/forest.webp";
import friends from "./photos/friends.webp";
import hall from "./photos/hall.webp";
import lift from "./photos/lift.webp";
import mirror from "./photos/mirror.webp";
import newYear from "./photos/new-year.webp";
import pizza from "./photos/pizza.webp";
import polaroid from "./photos/polaroid.webp";
import portrait from "./photos/portrait.webp";
import room from "./photos/room.webp";
import stage from "./photos/stage.webp";
import statue from "./photos/statue.webp";
import sunset from "./photos/sunset.webp";
import { CHAPTERS, RIBBON_BLEEDS, RIBBON_SPANS, SPANS } from "./story-data";
import { LaunchChart, NightLog } from "./story-figures";
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
  const photos = useTranslations("home.story.photos");
  return (
    <StoryChapter id="omsk">
      <StoryBleed label={photos("corridor")} src={corridor} />
      <StoryCol weight={1}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("school")}</StoryText>
        <StoryText>{t("game")}</StoryText>
        <StoryPhoto drift={30} label={photos("polaroid")} size={11} src={polaroid} tilt={-3} />
      </StoryCol>
      <StoryCol at="middle" weight={2}>
        <StoryMenus />
      </StoryCol>
      <StoryCol at="bottom" weight={1}>
        <StoryPile>
          <StoryPhoto label={photos("newYear")} size={20} src={newYear} tilt={-2} />
          <StoryPhoto drift={90} label={photos("pizza")} size={14} src={pizza} tilt={3} />
        </StoryPile>
        <StoryQuote>{t("quote")}</StoryQuote>
        <StoryText>{t("after")}</StoryText>
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
        <StoryQuote drift={60}>{t("quote")}</StoryQuote>
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
        <p className="story-rank" data-reveal>
          <span className="story-rank-number font-display">{t("rank")}</span>
          <span className="story-rank-label">{t("rankLabel")}</span>
        </p>
        <LaunchChart />
      </StoryCol>
      <StoryCol at="bottom" weight={0.8}>
        <StoryPile>
          <StoryPhoto
            caption={t("eveCaption")}
            label={photos("eve")}
            size={22}
            src={eve}
            tilt={-1.5}
          />
          <StoryPhoto
            caption={t("stageCaption")}
            drift={80}
            label={photos("stage")}
            size={14}
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
        <StoryQuote drift={60}>{t("quote")}</StoryQuote>
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
        <StoryQuote drift={60}>{t("quote")}</StoryQuote>
        <NightLog />
      </StoryCol>
      <StoryCol at="bottom" weight={0.9}>
        <StoryText>{t("wait")}</StoryText>
        <StoryText>
          <b>{t("grant")}</b> {t("move")}
        </StoryText>
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
        <StoryQuote drift={50}>{t("quote")}</StoryQuote>
      </StoryCol>
      <StoryBleed label={photos("friends")} src={friends} />
      <StoryBleed label={photos("room")} src={room} />
      <StoryBleed label={photos("statue")} src={statue} />
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
          <StoryPhoto label={photos("sunset")} size={25} src={sunset} tilt={1} />
          <StoryPhoto drift={90} label={photos("hall")} size={12} src={hall} tilt={-2.5} />
        </StoryPile>
        <StoryQuote>{t("quote")}</StoryQuote>
        <StoryText>{t("prompts")}</StoryText>
      </StoryCol>
    </StoryChapter>
  );
}

function Now() {
  const t = useTranslations("home.story.now");
  const photos = useTranslations("home.story.photos");
  return (
    <StoryChapter id="now">
      <StoryCol at="middle" weight={1}>
        <StoryHead date={t("date")} title={t("title")} />
        <StoryText>{t("first")}</StoryText>
        <p className="story-caption" data-reveal>
          {t("firstSource")}
        </p>
        <StoryText>{t("next")}</StoryText>
        <StoryQuote drift={30}>{t("quote")}</StoryQuote>
      </StoryCol>
      <StoryBleed label={photos("portrait")} src={portrait} />
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
        style={{ "--spans": RIBBON_SPANS, "--bleeds": RIBBON_BLEEDS }}
      >
        <div className="story-stage" data-under>
          <div aria-hidden className="story-paper" data-story-paper />
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
