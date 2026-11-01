/** The mark of the settings, for the button and for its view in the code layer. */
export function SettingsIcon() {
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 20 20"
    >
      <path d="M3 6h7M15 6h2M3 14h2M10 14h7" />
      <circle cx="12.5" cy="6" r="2.25" />
      <circle cx="7.5" cy="14" r="2.25" />
    </svg>
  );
}
