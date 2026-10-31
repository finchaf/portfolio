import type { ReactNode } from "react";

import { CodeFace } from "@/ui/code-face";
import { CodeSource } from "@/ui/code-source";

import { HERO_SOURCE, SWITCH_SOURCE } from "./hero-source";

/** A block's source in the block's own place: the block itself, hidden, gives it the room. */
function Twin({ shape, lines }: { shape: ReactNode; lines: readonly string[] }) {
  return (
    <div className="hero-twin" data-plan>
      <div className="invisible">{shape}</div>
      <CodeSource className="hero-source" lines={lines} />
    </div>
  );
}

export interface HeroCodeProps {
  words: readonly string[];
  status: ReactNode;
  copy: ReactNode;
  proof: ReactNode;
  work: ReactNode;
  github: ReactNode;
  labels: Record<"design" | "code" | "work" | "github", string>;
}

/**
 * The same screen as its source, block for block over the design: what the lens uncovers, and the
 * plan the first screen assembles on when a page opens. A decoration for the eye, since the source
 * says nothing the text does not. Its controls are only pictures: the real ones lie under it.
 */
export function HeroCode({ words, status, copy, proof, work, github, labels }: HeroCodeProps) {
  return (
    <div aria-hidden className="hero-layer hero-code" data-hero-code data-tint="home">
      <div className="hero-top">
        <Twin lines={HERO_SOURCE.status} shape={status} />
      </div>

      <div className="hero-frame">
        <p className="hero-name hero-outline font-display font-extrabold">
          {words.map((word, index) => (
            <span key={word}>
              {word}
              {index < words.length - 1 && " "}
              <span className="hero-hatch code-hatch">{word}</span>
            </span>
          ))}
        </p>
        <i className="hero-box" data-hero-box />
      </div>

      <div className="hero-foot">
        <Twin lines={HERO_SOURCE.copy} shape={copy} />
        <div className="hero-side">
          <Twin lines={HERO_SOURCE.proof} shape={proof} />
          <div className="hero-actions">
            <CodeSource className="hero-near" lines={HERO_SOURCE.action} />
            <span className="hero-control" data-plan>
              <CodeFace className="control-shape" shape={work}>
                {labels.work}
              </CodeFace>
            </span>
            <span className="hero-control" data-plan>
              <CodeFace shape={github}>{labels.github}</CodeFace>
            </span>
          </div>
        </div>
      </div>

      <div className="hero-switch-twin">
        <div className="hero-control segmented" data-plan>
          {(["design", "code"] as const).map((layer) => (
            <span className="control-shape" data-tab={layer} key={layer}>
              <CodeFace
                className="control-shape"
                shape={<span className="segmented-option">{labels[layer]}</span>}
              >
                {labels[layer]}
              </CodeFace>
            </span>
          ))}
        </div>
        <CodeSource className="hero-switch-source" lines={SWITCH_SOURCE} />
      </div>
    </div>
  );
}
