import Image from "next/image";
import { useTranslations } from "next-intl";

import menus from "./photos/menus.webp";
import { FIELD, MENUS, SPRITE } from "./story-data";

/** Every frame shows a cell of the one picture, which says all there is to say by itself. */
const DECORATIVE = "";

const percent = (share: number) => `${String(share * 100)}%`;

/**
 * The file behind the first chapter, with nothing around it: 47 separate frames on the page, where
 * they lie in Figma. They share one small picture, so 47 elements cost a single request. A scene
 * deals them out of one stack; without a scene they simply lie in their places.
 */
export function StoryMenus() {
  const t = useTranslations("home.story.omsk");
  return (
    <div aria-label={t("menus")} className="story-menus" data-menus role="img">
      {MENUS.map(({ menu, left, top, fromX, fromY }) => (
        <div
          aria-hidden
          className="story-menu"
          data-from-x={fromX}
          data-from-y={fromY}
          data-menu={menu}
          data-name={`${t("menuName")} ${String(menu)}`}
          key={menu}
          style={{
            left: percent(left),
            top: percent(top),
            width: percent(1 / FIELD.columns),
          }}
        >
          <div className="story-menu-cell">
            <Image
              alt={DECORATIVE}
              className="story-menu-sprite"
              src={menus}
              style={{
                left: `${String(-((menu - 1) % SPRITE.columns) * 100)}%`,
                top: `${String(-Math.floor((menu - 1) / SPRITE.columns) * 100)}%`,
              }}
              unoptimized
            />
          </div>
        </div>
      ))}
    </div>
  );
}
