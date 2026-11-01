import "./write.css";

import { useTranslations } from "next-intl";

import { EMAIL, TELEGRAM_HANDLE, TELEGRAM_URL } from "@/lib/site";
import { ButtonLink } from "@/ui/button-link";

import { CopyAddress } from "./copy-address";
import { TelegramCode } from "./telegram-code";
import { WriteSheet } from "./write-sheet";

/** What «Написать» opens: both ways at once, Telegram with a code for a phone beside the screen. */
export function WriteMenu() {
  const t = useTranslations("shell");
  const mail = `mailto:${EMAIL}`;
  return (
    <WriteSheet label={t("write")}>
      <p className="write-lead">{t("footer.reply")}</p>
      <section className="write-part">
        <h2 className="write-tag">{t("footer.telegram")}</h2>
        <p className="write-value font-display">{TELEGRAM_HANDLE}</p>
        <div className="write-scan">
          <TelegramCode label={t("contact.code")} />
          <p>{t("contact.scan")}</p>
        </div>
        <ButtonLink href={TELEGRAM_URL} rel="noreferrer" size="small" target="_blank">
          {t("contact.open")}
        </ButtonLink>
      </section>
      <section className="write-part">
        <h2 className="write-tag">{t("contact.mail")}</h2>
        <a className="write-value write-address" href={mail}>
          {EMAIL}
        </a>
        <div className="write-foot">
          <ButtonLink href={mail} size="small">
            {t("contact.send")}
          </ButtonLink>
          <CopyAddress
            address={EMAIL}
            labels={{ copy: t("contact.copy"), copied: t("contact.copied") }}
          />
        </div>
      </section>
    </WriteSheet>
  );
}
