"use client";

import { useEffect, useRef, useState } from "react";

import { COMMAND } from "@/lib/project-facts";

/** Milliseconds a step of the release stays lit in the replay. */
const STEP = 460;
/** The step at which the link really moves. */
const SWITCH = 3;
/** The last step is what happens on a failure: a good release never gets there. */
const GOOD_STEPS = 5;
const KEPT = 3;

/** The release as `deploy.py` does it: steps on one side, the folders and the link on the other. */
export function DemoRelease({
  releases,
  steps,
  strings,
}: {
  releases: string[];
  steps: string[];
  strings: { deploy: string; rollback: string; current: string; fresh: string };
}) {
  const [folders, setFolders] = useState(releases);
  const [live, setLive] = useState(releases[0] ?? "");
  const [step, setStep] = useState(-1);
  const timers = useRef<number[]>([]);
  const running = step >= 0;

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, []);

  const deploy = () => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const build = strings.fresh;
    const land = () => {
      setFolders((list) => [build, ...list.filter((each) => each !== build)].slice(0, KEPT));
      setLive(build);
    };
    if (calm) {
      land();
      return;
    }
    for (let index = 0; index < GOOD_STEPS; index += 1) {
      timers.current.push(
        window.setTimeout(() => {
          setStep(index);
          if (index === SWITCH) land();
        }, index * STEP),
      );
    }
    timers.current.push(
      window.setTimeout(() => {
        setStep(-1);
      }, GOOD_STEPS * STEP),
    );
  };

  const rollback = () => {
    setLive((now) => folders[folders.indexOf(now) + 1] ?? now);
  };

  return (
    <div className="pj-release-demo">
      <ol className="pj-release-steps">
        {steps.map((text, index) => (
          <li data-on={index === step || undefined} key={text}>
            {text}
          </li>
        ))}
      </ol>
      <div className="pj-term pj-release-folders">
        <p className="pj-term-command">{COMMAND.releases}</p>
        {folders.map((name) => (
          <p data-live={name === live || undefined} key={name}>
            <span>{name}</span>
            <em>{name === live ? `← ${strings.current}` : ""}</em>
          </p>
        ))}
        <div className="pj-release-actions">
          <button className="pj-mini" disabled={running} onClick={deploy} type="button">
            {strings.deploy}
          </button>
          <button
            className="pj-mini"
            disabled={running || folders.indexOf(live) >= folders.length - 1}
            onClick={rollback}
            type="button"
          >
            {strings.rollback}
          </button>
        </div>
      </div>
    </div>
  );
}
