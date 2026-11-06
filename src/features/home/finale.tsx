import "./after-work.css";

import { Image } from "@/ui/image";
import { useLocale, useTranslations } from "next-intl";

import { isLocale } from "@/i18n/locales";
import { EMAIL, GITHUB_HANDLE, GITHUB_URL, TELEGRAM_HANDLE, TELEGRAM_URL } from "@/lib/site";
import { CopyAddress } from "@/ui/copy-address";
import { LocalClock } from "@/ui/local-clock";
import { TelegramCode } from "@/ui/telegram-code";

import { ChatDraft } from "./chat-draft";
import { DriftTitle } from "./drift-title";
import face from "./portrait-small.avif";

/** The face beside the name is the same person the name says: a screen reader hears it once. */
const DECORATIVE = "";

/** How far the two lines of the last call start apart, in pixels of the wide screen. */
const TITLE_DEPTH = 240;

/**
 * The last call, with every way open on the page rather than behind a button: the mail whole and
 * copyable, and the chat drawn as it will open, with its first line typing itself. The whole window
 * is the link to the chat; on a computer a code beside it opens the chat on a phone.
 */
export function Finale() {
  const t = useTranslations("home.finale");
  const shell = useTranslations("shell");
  const hero = useTranslations("home.hero");
  const current = useLocale();
  const locale = isLocale(current) ? current : "ru";
  return (
    <section aria-labelledby="finale-title" className="talk" id="contact">
      <div className="talk-in">
        <div className="talk-copy">
          <p className="exp-live">
            <span aria-hidden className="exp-dot" />
            <span>{hero("status")}</span>
            <span className="exp-where">
              {hero("city")}
              <LocalClock locale={locale} />
            </span>
          </p>
          <DriftTitle
            className="talk-title finale-title font-display font-extrabold"
            cross
            depth={TITLE_DEPTH}
            id="finale-title"
          >
            {t("title")}
          </DriftTitle>
          <p className="talk-lead">{t("text")}</p>
          <ul aria-label={t("ways")} className="talk-ways">
            <li className="talk-way">
              <a className="talk-way-link" href={`mailto:${EMAIL}`}>
                <span className="talk-key">{t("mail")}</span>
                <span className="talk-value">{EMAIL}</span>
              </a>
              <CopyAddress
                address={EMAIL}
                className="talk-copy-button control-button control-quiet control-small"
                labels={{ copy: shell("contact.copy"), copied: shell("contact.copied") }}
              />
            </li>
            <li className="talk-way">
              <a className="talk-way-link" href={GITHUB_URL}>
                <span className="talk-key">{t("github")}</span>
                <span className="talk-value">{GITHUB_HANDLE}</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="talk-chat">
          <a className="talk-window" href={TELEGRAM_URL} rel="noreferrer" target="_blank">
            {/* The window's own head and thread are a picture of the chat: the send names the link. */}
            <span aria-hidden className="talk-bar">
              <Image alt={DECORATIVE} className="talk-avatar" src={face} unoptimized />
              <span className="talk-who">
                <b>{hero("name")}</b>
                <span>
                  <span>{TELEGRAM_HANDLE}</span>
                  <span className="talk-service">{t("chat.service")}</span>
                </span>
              </span>
            </span>
            <span aria-hidden className="talk-thread">
              <span className="talk-day">{t("chat.day")}</span>
              <span className="talk-in-line">
                {t("chat.hello")}
                <time className="talk-time">
                  <LocalClock bare locale={locale} />
                </time>
              </span>
              <span className="talk-out-line">
                <ChatDraft text={t("chat.draft")} />
              </span>
            </span>
            <span className="talk-send">
              <span>
                {t("chat.send")}
                <span className="sr-only"> {TELEGRAM_HANDLE}</span>
              </span>
              <b aria-hidden>
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
                </svg>
              </b>
            </span>
          </a>
          <figure className="talk-sticker">
            <TelegramCode className="talk-code" label={shell("contact.code")} />
            <figcaption>{t("chat.scan")}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
