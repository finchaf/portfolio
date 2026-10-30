"use client";

import { ErrorView } from "@/shell/error-view";

export default function Error({ reset }: { reset: () => void }) {
  return <ErrorView retry={reset} />;
}
