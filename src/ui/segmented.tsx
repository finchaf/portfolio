import type { ReactNode } from "react";

import "./segmented.css";

export interface SegmentedOption<Value extends string | number> {
  value: Value;
  label: string;
  /** A mark beside the word: a theme shows the word, the mark or both (ADR-0011). */
  icon?: ReactNode;
}

export interface SegmentedProps<Value extends string | number> {
  /** The group's name for a form and for a screen reader. */
  name: string;
  label: string;
  /** `hidden` when the group's name is already on the screen beside it, as a row's key. */
  legend?: "shown" | "hidden";
  value: Value;
  options: readonly SegmentedOption<Value>[];
  onChange: (value: Value) => void;
}

/**
 * A choice of a few values, as native radio buttons: arrows and focus come with them. A theme decides
 * the look from its `--tab*` variables; a number before each choice is there for the themes that show
 * one, as tmux numbers its windows.
 */
export function Segmented<Value extends string | number>({
  name,
  label,
  legend = "shown",
  value,
  options,
  onChange,
}: SegmentedProps<Value>) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className={legend === "hidden" ? "sr-only" : "pb-1 text-xs text-muted"}>
        {label}
      </legend>
      <div className="segmented">
        {options.map((option, index) => (
          <label
            className="segmented-option"
            key={option.value}
            title={option.icon ? option.label : undefined}
          >
            <input
              checked={value === option.value}
              className="sr-only"
              name={name}
              onChange={() => {
                onChange(option.value);
              }}
              type="radio"
            />
            <SegmentedParts icon={option.icon} index={index} label={option.label} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** What a choice is made of, for a choice that is a link rather than a radio button. */
export function SegmentedParts({
  index,
  icon,
  label,
}: {
  index: number;
  icon?: ReactNode;
  label: string;
}) {
  return (
    <>
      <span aria-hidden className="segmented-number">
        {index + 1}
      </span>
      {icon ? (
        <span aria-hidden className="segmented-glyph">
          {icon}
        </span>
      ) : null}
      <span className="segmented-label">{label}</span>
    </>
  );
}
