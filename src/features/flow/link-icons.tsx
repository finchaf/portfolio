/** The app's two link icons have no match in Lucide: a link with an arrow going in or out. */
function LinkMark({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      width="18"
    >
      <path d="M9 15 15 9M11 6l1.5-1.6a4.6 4.6 0 0 1 6.5 6.5L17.4 12.5M13 18l-1.5 1.6A4.6 4.6 0 0 1 5 13l1.6-1.5" />
      {children}
    </svg>
  );
}

export function LinksIn() {
  return (
    <LinkMark>
      <path d="M22 20h-6M18.500 17.500 16 20l2.500 2.500" />
    </LinkMark>
  );
}

export function LinksOut() {
  return (
    <LinkMark>
      <path d="M16 20h6M19.500 17.500 22 20l-2.500 2.500" />
    </LinkMark>
  );
}
