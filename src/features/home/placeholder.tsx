export interface PlaceholderProps {
  kind: "phone" | "browser" | "frame";
  label: string;
  className?: string;
}

/** Where a mockup or a recording will stand, in its real proportions: never for publication. */
export function Placeholder({ kind, label, className = "" }: PlaceholderProps) {
  return (
    <div className={`placeholder placeholder-${kind} ${className}`} data-mock>
      <span className="font-mono text-xs text-muted">{label}</span>
    </div>
  );
}
