import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

/** The six looks of the made-up app, in src/themes/flow-looks.css, and the one its tool recommended. */
export const APP_LOOKS = ["a", "b", "c", "d", "e", "f"] as const;
export const DEFAULT_LOOK = "c";

/** A block of a wireframe, placed in percent of the frame. */
function Wire({
  shape,
  top,
  left,
  width,
  height,
  label,
}: {
  shape: string;
  top: number;
  left: number;
  width?: number;
  height?: number;
  label?: string;
}) {
  const style = { "--t": top, "--l": left, "--w": width, "--ht": height } as CSSProperties;
  return (
    <div className={shape} style={style}>
      {label ? <span>{label}</span> : null}
    </div>
  );
}

function StatusBar() {
  const t = useTranslations("flow.app");
  return (
    <div className="sb">
      <span>{t("time")}</span>
      <i />
    </div>
  );
}

export function WelcomeScreen() {
  const t = useTranslations("flow.app");
  return (
    <div className="scr s-welcome">
      <StatusBar />
      <div className="sky">
        <i className="moon" />
        <i className="arc a1" />
        <i className="arc a2" />
        <i className="st s1" />
        <i className="st s2" />
        <i className="st s3" />
        <i className="st s4" />
      </div>
      <div className="tx">
        <h3>{t("welcomeTitle")}</h3>
        <p>{t("welcomeText")}</p>
      </div>
      <div className="dots">
        <i className="on" />
        <i />
        <i />
      </div>
      <div className="scr-cta">{t("continue")}</div>
    </div>
  );
}

export function PaywallScreen() {
  const t = useTranslations("flow.app");
  return (
    <div className="scr s-paywall">
      <StatusBar />
      <div className="round x">{t("glyphClose")}</div>
      <div className="tx">
        <h3>{t("paywallTitle")}</h3>
      </div>
      <ul className="ben">
        <li>
          <i />
          {t("benefit1")}
        </li>
        <li>
          <i />
          {t("benefit2")}
        </li>
        <li>
          <i />
          {t("benefit3")}
        </li>
      </ul>
      <div className="plans">
        <div className="plan on">
          <b>{t("yearly")}</b>
          <span>{t("yearlyPrice")}</span>
        </div>
        <div className="plan">
          <b>{t("monthly")}</b>
          <span>{t("monthlyPrice")}</span>
        </div>
      </div>
      <div className="scr-cta">{t("continue")}</div>
      <p className="fine">{t("fine")}</p>
    </div>
  );
}

const WEEK = [0.62, 0.8, 0.48, 0.9, 0.7, 0.56, 0.84];
const DAYS = ["day1", "day2", "day3", "day4", "day5", "day6", "day7"] as const;

export function HomeScreen() {
  const t = useTranslations("flow.app");
  return (
    <div className="scr s-home">
      <StatusBar />
      <div className="bar">
        <h3>{t("tonight")}</h3>
        <div className="round">{t("glyphMore")}</div>
      </div>
      <div className="ring">
        <svg aria-hidden viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="86" />
          <circle
            className="v"
            cx="100"
            cy="100"
            pathLength="100"
            r="86"
            strokeDasharray="78 100"
          />
        </svg>
        <div>
          <b>{t("score")}</b>
          <span>{t("lastNight")}</span>
        </div>
      </div>
      <div className="week">
        {WEEK.map((value, index) => (
          <i
            className={index === WEEK.length - 1 ? "on" : undefined}
            key={index}
            style={{ "--h": value }}
          />
        ))}
      </div>
      <div className="days">
        {DAYS.map((day) => (
          <span key={day}>{t(day)}</span>
        ))}
      </div>
      <div className="scr-cta">{t("start")}</div>
      <div className="tabbar">
        <i className="on" />
        <i />
        <i />
      </div>
    </div>
  );
}

export function NightScreen() {
  const t = useTranslations("flow.app");
  return (
    <div className="scr s-night">
      <StatusBar />
      <div className="bar">
        <div className="round">{t("glyphBack")}</div>
        <div className="round">{t("glyphMore")}</div>
      </div>
      <div className="tx">
        <h3>{t("nightTitle")}</h3>
        <p>{t("nightTime")}</p>
      </div>
      <svg aria-hidden className="hyp" preserveAspectRatio="none" viewBox="0 0 330 150">
        <path d="M0 20H26V60H62V120H118V60H150V30H176V60H214V120H252V60H292V30H330" />
      </svg>
      <div className="axis">
        <span>{t("awake")}</span>
        <span>{t("rem")}</span>
        <span>{t("light")}</span>
        <span>{t("deep")}</span>
      </div>
      <ul className="stats">
        <li>
          <b>{t("deepValue")}</b>
          <span>{t("deep")}</span>
        </li>
        <li>
          <b>{t("remValue")}</b>
          <span>{t("rem")}</span>
        </li>
        <li>
          <b>{t("wokeValue")}</b>
          <span>{t("woke")}</span>
        </li>
      </ul>
      <div className="memo">{t("memo")}</div>
    </div>
  );
}

export function WelcomeWire() {
  const t = useTranslations("flow.app");
  return (
    <div className="wf">
      <Wire height={44} label={t("wfHero")} left={6} shape="w-b h" top={10} width={88} />
      <Wire left={6} shape="w-l" top={60} width={70} />
      <Wire left={6} shape="w-l s" top={66} width={84} />
      <Wire left={6} shape="w-l s" top={69.5} width={56} />
      <Wire left={44} shape="w-d" top={80} />
      <Wire height={7} label={t("wfCta")} left={6} shape="w-b c" top={86} width={88} />
    </div>
  );
}

export function PaywallWire() {
  const t = useTranslations("flow.app");
  return (
    <div className="wf">
      <Wire left={6} shape="w-r" top={7} />
      <Wire left={6} shape="w-l" top={17} width={80} />
      <Wire left={6} shape="w-l" top={22} width={50} />
      <Wire left={6} shape="w-l s" top={32} width={60} />
      <Wire left={6} shape="w-l s" top={37} width={60} />
      <Wire left={6} shape="w-l s" top={42} width={60} />
      <Wire height={10} label={t("wfPlan")} left={6} shape="w-b p" top={53} width={88} />
      <Wire height={10} label={t("wfPlan")} left={6} shape="w-b q" top={65} width={88} />
      <Wire height={7} label={t("wfCta")} left={6} shape="w-b c" top={81} width={88} />
      <Wire left={25} shape="w-l s" top={91} width={50} />
    </div>
  );
}

export function HomeWire() {
  const t = useTranslations("flow.app");
  return (
    <div className="wf">
      <Wire left={6} shape="w-l" top={8} width={42} />
      <Wire left={82} shape="w-r" top={7} />
      <Wire height={29.5} label={t("wfRing")} left={18} shape="w-b h round" top={17} width={64} />
      <Wire height={15} label={t("wfWeek")} left={6} shape="w-b q" top={52} width={88} />
      <Wire height={7} label={t("wfCta")} left={6} shape="w-b c" top={72} width={88} />
      <Wire height={7} label={t("wfTabs")} left={20} shape="w-b q" top={84} width={60} />
    </div>
  );
}

export function NightWire() {
  const t = useTranslations("flow.app");
  return (
    <div className="wf">
      <Wire left={6} shape="w-r" top={7} />
      <Wire left={82} shape="w-r" top={7} />
      <Wire left={6} shape="w-l" top={16} width={62} />
      <Wire left={6} shape="w-l s" top={21} width={36} />
      <Wire height={26} label={t("wfChart")} left={6} shape="w-b h" top={28} width={88} />
      <Wire height={10} left={6} shape="w-b q" top={60} width={27} />
      <Wire height={10} left={36.5} shape="w-b q" top={60} width={27} />
      <Wire height={10} left={67} shape="w-b q" top={60} width={27} />
      <Wire height={12} label={t("wfNote")} left={6} shape="w-b p" top={75} width={88} />
    </div>
  );
}

/** The phone of one rule's history: a menu under its button, then on its place. `data-rung` above moves it. */
export function RuleDemo() {
  const t = useTranslations("flow.app");
  return (
    <div aria-hidden className="demo">
      <div className="d-phone">
        <div className="d-bar">
          <span className="d-title">{t("menuTitle")}</span>
          <span className="d-btn">{t("glyphMore")}</span>
          <span className="d-menu">
            <i>{t("menuShare")}</i>
            <i>{t("menuNote")}</i>
            <i>{t("menuDelete")}</i>
          </span>
        </div>
        <div className="d-body">
          <i />
          <i />
          <i />
        </div>
        <span className="d-check">{t("corner")}</span>
      </div>
    </div>
  );
}
