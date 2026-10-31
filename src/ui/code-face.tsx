import "./code-face.css";

import type { ReactNode } from "react";

export interface CodeFaceProps {
  /** The real control, hidden, to give this one its exact size. */
  shape: ReactNode;
  /** The corners of the control. */
  className?: string;
  children: ReactNode;
}

/** The view of a control in the code layer, in the place and the size of the control itself. */
export function CodeFace({ shape, className = "", children }: CodeFaceProps) {
  return (
    <span className={`relative inline-grid ${className}`}>
      <span className="invisible">{shape}</span>
      <span className="code-face">
        <span>{children}</span>
      </span>
    </span>
  );
}
