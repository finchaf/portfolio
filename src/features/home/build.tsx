import { useTranslations } from "next-intl";

import { BuildScene } from "./build-scene";

/** Design into code: the strings for the scene, which holds the card's state. */
export function Build() {
  const t = useTranslations("home.build");
  return (
    <BuildScene
      text={{
        eyebrow: t("eyebrow"),
        stages: (["whole", "layers", "code"] as const).map((key) => ({
          key,
          title: t(`stages.${key}.title`),
          text: t(`stages.${key}.text`),
        })),
        layers: {
          surface: t("layers.surface"),
          shape: t("layers.shape"),
          text: t("layers.text"),
        },
        lesson: {
          subject: t("lesson.subject"),
          time: t("lesson.time"),
          room: t("lesson.room"),
          kind: t("lesson.kind"),
          teacher: t("lesson.teacher"),
        },
        lab: {
          title: t("lab.title"),
          radius: t("lab.radius"),
          density: t("lab.density"),
          tone: t("lab.tone"),
          densities: { compact: t("lab.densityCompact"), regular: t("lab.densityRegular") },
          tones: {
            accent: t("lab.toneAccent"),
            success: t("lab.toneSuccess"),
            warning: t("lab.toneWarning"),
          },
        },
      }}
    />
  );
}
