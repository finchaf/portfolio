"use client";

import { useRef, useState } from "react";

import { gsap, headerHeight, MOTION_ALLOWED, ScrollTrigger, useGSAP } from "@/motion/gsap";
import { SCENE } from "@/motion/tokens";

import {
  DENSITIES,
  LessonCard,
  RADII,
  TONES,
  type Density,
  type Layer,
  type LessonCardProps,
  type Radius,
  type Tone,
} from "./lesson-card";
import { Segmented } from "./segmented";

const LAYERS: readonly Layer[] = ["surface", "shape", "text"];

const CODE_OPEN = "<LessonCard";
const CODE_CLOSE = "/>";

export interface BuildText {
  eyebrow: string;
  stages: readonly { key: string; title: string; text: string }[];
  layers: Record<Layer, string>;
  lesson: Pick<LessonCardProps, "subject" | "time" | "room" | "kind" | "teacher">;
  lab: {
    title: string;
    radius: string;
    density: string;
    tone: string;
    densities: Record<Density, string>;
    tones: Record<Tone, string>;
  };
}

/**
 * Design into code, on a depth axis. A card opens into its layers and folds back as a component
 * with its code beside it; at the end of the scroll the reader changes its tokens. The code on the
 * screen is built from the same props the card receives, so it cannot drift from what is drawn.
 */
export function BuildScene({ text }: { text: BuildText }) {
  const [radius, setRadius] = useState<Radius>(16);
  const [density, setDensity] = useState<Density>("regular");
  const [tone, setTone] = useState<Tone>("accent");
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_ALLOWED, () => {
        const section = scope.current;
        if (!section) return;
        const find = (name: string) => gsap.utils.toArray<HTMLElement>(`[${name}]`, section);
        const stack = find("data-stack");
        const layers = find("data-layer");
        const parts = find("data-layer-part");
        const captions = find("data-caption");
        const whole = find("data-whole");
        const code = find("data-code");
        const lab = find("data-lab");

        const scene = gsap.timeline({
          defaults: { ease: SCENE.move },
          scrollTrigger: {
            trigger: section,
            start: () => `top top+=${headerHeight()}`,
            end: "bottom bottom",
            scrub: ScrollTrigger.isTouch === 1 ? true : SCENE.catchUp,
          },
        });
        scene
          .to({}, { duration: SCENE.rest })
          .to(stack, { "--open": 1, duration: 1 })
          .to(parts, { opacity: 1, duration: 0.4 }, "<0.6")
          .to(captions[0] ?? {}, { opacity: 0, duration: 0.3 }, "<-0.3")
          .to(captions[1] ?? {}, { opacity: 1, duration: 0.3 }, ">")
          .to({}, { duration: SCENE.rest })
          .to(parts, { opacity: 0, duration: 0.3 })
          .to(stack, { "--open": 0, duration: 1 }, "<")
          .to(captions[1] ?? {}, { opacity: 0, duration: 0.3 }, "<")
          .to(captions[2] ?? {}, { opacity: 1, duration: 0.3 }, ">")
          .fromTo(code, { y: 32 }, { y: 0, opacity: 1, duration: 0.6 }, "<")
          .set(whole, { opacity: 1 })
          .set(layers, { opacity: 0 })
          .to(lab, { opacity: 1, duration: 0.4 }, "<")
          .to({}, { duration: SCENE.rest });

        // A keyboard reaching the controls lands on the end of the scene, where they are visible.
        const showControls = () => {
          const trigger = scene.scrollTrigger;
          if (trigger && window.scrollY < trigger.end) window.scrollTo({ top: trigger.end });
        };
        const controls = lab[0];
        controls?.addEventListener("focusin", showControls);
        return () => {
          controls?.removeEventListener("focusin", showControls);
        };
      });
    },
    { scope },
  );

  const card = { ...text.lesson, radius, density, tone };
  const props: readonly [string, string, boolean][] = [
    ["subject=", JSON.stringify(text.lesson.subject), false],
    ["time=", JSON.stringify(text.lesson.time), false],
    ["radius=", `{${radius}}`, true],
    ["density=", JSON.stringify(density), true],
    ["tone=", JSON.stringify(tone), true],
  ];

  return (
    <section
      aria-labelledby="build-title"
      className="build"
      data-tint="home"
      id="build"
      ref={scope}
    >
      <div className="build-stage">
        <div className="build-copy">
          <h2 className="font-mono text-sm text-muted" id="build-title">
            {text.eyebrow}
          </h2>
          <ol className="build-captions">
            {text.stages.map((stage) => (
              <li className="build-caption" data-caption key={stage.key}>
                <h3 className="font-display text-3xl leading-tight font-bold lg:text-5xl">
                  {stage.title}
                </h3>
                <p className="text-lg text-muted lg:text-xl">{stage.text}</p>
              </li>
            ))}
          </ol>
          <div className="build-lab" data-lab>
            <p className="text-sm text-muted">{text.lab.title}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Segmented
                label={text.lab.radius}
                name="lesson-radius"
                onChange={setRadius}
                options={RADII.map((value) => ({ value, label: String(value) }))}
                value={radius}
              />
              <Segmented
                label={text.lab.density}
                name="lesson-density"
                onChange={setDensity}
                options={DENSITIES.map((value) => ({ value, label: text.lab.densities[value] }))}
                value={density}
              />
              <Segmented
                label={text.lab.tone}
                name="lesson-tone"
                onChange={setTone}
                options={TONES.map((value) => ({ value, label: text.lab.tones[value] }))}
                value={tone}
              />
            </div>
          </div>
        </div>

        <div className="build-visual">
          <div className="build-stack" data-stack>
            <div className="build-whole" data-whole>
              <LessonCard {...card} />
            </div>
            {LAYERS.map((layer, index) => (
              <div
                aria-hidden
                className="build-layer"
                data-layer
                key={layer}
                style={{ "--height": index - 1 }}
              >
                <LessonCard {...card} layer={layer} />
                <i className="build-layer-plane" data-layer-part style={{ borderRadius: radius }} />
                <span className="build-layer-label font-mono text-xs" data-layer-part>
                  {text.layers[layer]}
                </span>
              </div>
            ))}
          </div>
          <pre
            className="build-code overflow-x-auto rounded-2xl bg-surface p-4 font-mono text-sm leading-relaxed"
            data-code
          >
            <code>
              <span className="text-muted">{CODE_OPEN}</span>
              {props.map(([name, value, live]) => (
                <span className="block pl-4" key={name}>
                  <span className="text-muted">{name}</span>
                  <span className={live ? "build-token" : undefined} key={value}>
                    {value}
                  </span>
                </span>
              ))}
              <span className="text-muted">{CODE_CLOSE}</span>
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
