import { useLocale, useTranslations } from "next-intl";

import { GITHUB_URL } from "@/lib/site";
import { ButtonLink } from "@/ui/button-link";
import { LocalClock } from "@/ui/local-clock";

import { HeroCode } from "./hero-code";
import { HeroLens } from "./hero-lens";

/** The first screen: who this is and what they do, in the HTML. The lens is an extra layer on top. */
export function Hero() {
  const t = useTranslations("home.hero");
  const locale = useLocale();
  const words = t("name").split(" ");

  const status = (
    <p className="hero-status flex items-center gap-2 text-sm whitespace-nowrap text-muted">
      <span aria-hidden className="hero-dot size-2 rounded-full bg-success" />
      <span>
        {t("status")}
        <span className="hero-where">
          {" · "}
          {t("city")}
          <LocalClock locale={locale} />
        </span>
      </span>
    </p>
  );
  const copy = (
    <div className="hero-copy flex max-w-[42rem] flex-col gap-1 lg:gap-2">
      <p className="font-display font-semibold">
        {t("role")} <span className="text-muted">· {t("roleNote")}</span>
      </p>
      <p className="hero-statement">{t("statement")}</p>
    </div>
  );
  const proof = (
    <ul className="hero-proof flex flex-col gap-1.5 text-sm lg:items-end">
      <li
        className="w-fit rounded-md border border-dashed border-warning px-2 py-0.5 text-ink"
        data-placeholder
      >
        {t("proofPlaceholder")}
      </li>
      <li className="text-muted">{t("proofStores")}</li>
    </ul>
  );
  const work = <ButtonLink href="#work">{t("work")}</ButtonLink>;
  const github = (
    <a className="control-link px-1 py-2" href={GITHUB_URL}>
      {t("github")}
    </a>
  );

  return (
    <HeroLens labels={{ label: t("lens.label"), design: t("lens.design"), code: t("lens.code") }}>
      <div className="hero-layer">
        <div className="hero-top">{status}</div>
        <h1 className="hero-name font-display font-extrabold" data-hero-name>
          {words.map((word, index) => (
            <span key={word}>
              {word}
              {index < words.length - 1 && " "}
            </span>
          ))}
        </h1>
        <div className="hero-foot">
          {copy}
          <div className="hero-side">
            {proof}
            <div className="hero-actions">
              {work}
              {github}
            </div>
          </div>
        </div>
      </div>
      <HeroCode
        copy={copy}
        github={github}
        labels={{
          design: t("lens.design"),
          code: t("lens.code"),
          github: t("github"),
          work: t("work"),
        }}
        proof={proof}
        status={status}
        words={words}
        work={work}
      />
    </HeroLens>
  );
}
