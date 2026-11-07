"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const THEMES = ["projects", "home", "pora", "flow"] as const;
const VARIABLES = ["--control-face", "--control-radius", "--control-open", "--control-close"];

type Theme = (typeof THEMES)[number];
type Mode = "light" | "dark";

interface Strings {
  theme: string;
  mode: string;
  light: string;
  dark: string;
  sample: string;
  sampleText: string;
  sampleAction: string;
  sampleQuiet: string;
  text: string;
  soft: string;
  control: string;
}

/** The mode the reader is in: the choice on the document, or the system's. */
function readerMode(): Mode {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "dark" || chosen === "light") return chosen;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Both sources of the mode: the choice on the document, and the system's under no choice. */
function onThemeChange(change: () => void) {
  const watch = new MutationObserver(change);
  watch.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", change);
  return () => {
    watch.disconnect();
    scheme.removeEventListener("change", change);
  };
}

/** A colour as sRGB channels, read from a probe: a variable holds a `light-dark()`, not a colour. */
function channels(host: HTMLElement, property: string) {
  const probe = document.createElement("i");
  probe.style.color = `var(${property})`;
  host.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
}

/** The relative luminance of WCAG 2. */
function luminance(rgb: number[]) {
  const [r = 0, g = 0, b = 0] = rgb.map((value) => {
    const part = value / 255;
    return part <= 0.04045 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number[], b: number[]) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

/**
 * The same markup in any theme and mode, with what the browser really resolved read back from it:
 * the skin's values and the contrast of its pairs. Nothing here is written down by hand.
 */
export function DemoThemes({
  strings,
  locale,
  themeNames,
}: {
  strings: Strings;
  locale: string;
  themeNames: Record<Theme, string>;
}) {
  const [theme, setTheme] = useState<Theme>("projects");
  const [chosen, setMode] = useState<Mode | null>(null);
  const reader = useSyncExternalStore(onThemeChange, readerMode, () => "light");
  const mode = chosen ?? reader;
  const [read, setRead] = useState<{ tokens: [string, string][]; pairs: [string, string][] }>({
    tokens: [],
    pairs: [],
  });
  const sample = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sample.current;
    if (!node) return;
    const styles = getComputedStyle(node);
    const ratio = (a: string, b: string) =>
      new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(
        contrast(channels(node, a), channels(node, b)),
      );
    setRead({
      tokens: VARIABLES.map((name) => [
        name,
        styles
          .getPropertyValue(name)
          .trim()
          .replace(/\s*\/\s*""$/, "")
          .split(",")[0] ?? "",
      ]),
      pairs: [
        [strings.text, `${ratio("--ink", "--page")}:1`],
        [strings.soft, `${ratio("--muted", "--page")}:1`],
        [strings.control, `${ratio("--on-control", "--control-fill")}:1`],
      ],
    });
  }, [theme, mode, locale, strings]);

  return (
    <div className="pj-themes-demo">
      <div aria-label={strings.theme} className="pj-seg" role="group">
        {THEMES.map((key) => (
          <button
            aria-pressed={key === theme}
            key={key}
            onClick={() => {
              setTheme(key);
            }}
            type="button"
          >
            {themeNames[key]}
          </button>
        ))}
      </div>
      <div aria-label={strings.mode} className="pj-seg" role="group">
        {(["light", "dark"] as const).map((key) => (
          <button
            aria-pressed={key === mode}
            key={key}
            onClick={() => {
              setMode(key);
            }}
            type="button"
          >
            {strings[key]}
          </button>
        ))}
      </div>
      <div
        className={`pj-themes-sample pj-scheme-${mode}`}
        data-tint={theme}
        data-tint-fonts=""
        ref={sample}
      >
        <h3>{strings.sample}</h3>
        <p>{strings.sampleText}</p>
        <div>
          <span className="control-button control-primary control-regular">
            {strings.sampleAction}
          </span>
          <span className="control-button control-quiet control-regular">
            {strings.sampleQuiet}
          </span>
        </div>
      </div>
      <dl className="pj-themes-read">
        {read.pairs.map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        {read.tokens.map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
