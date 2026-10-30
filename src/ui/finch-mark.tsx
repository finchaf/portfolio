/** The site's mark: a chaffinch, in the three colours of the home theme. Decoration, never a label. */
export function FinchMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 32 32">
      <path className="fill-success" d="M2 25 13 9c6-3 13 0 14 7L11 27c-3 1-6 0-9-2Z" />
      <path className="fill-accent" d="M12 27c8 2 16-3 16-11 0-1 0-2-1-3L14 20l-2 7Z" />
      <circle className="fill-muted" cx="20" cy="10" r="7" />
      <path className="fill-ink" d="m26 8 5 2-5 2V8Z" />
      <circle className="fill-page" cx="22" cy="9" r="1.2" />
    </svg>
  );
}
