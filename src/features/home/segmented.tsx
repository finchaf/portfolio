import "./segmented.css";

export interface SegmentedProps<Value extends string | number> {
  /** The group's name for a form and for a screen reader. */
  name: string;
  label: string;
  value: Value;
  options: readonly { value: Value; label: string }[];
  onChange: (value: Value) => void;
}

/** A choice of a few values, as native radio buttons: arrows and focus come with them. */
export function Segmented<Value extends string | number>({
  name,
  label,
  value,
  options,
  onChange,
}: SegmentedProps<Value>) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="pb-1 text-xs text-muted">{label}</legend>
      <div className="segmented">
        {options.map((option) => (
          <label className="segmented-option" key={option.value}>
            <input
              checked={value === option.value}
              className="sr-only"
              name={name}
              onChange={() => {
                onChange(option.value);
              }}
              type="radio"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
