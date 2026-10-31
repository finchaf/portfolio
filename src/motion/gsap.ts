"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// The one place GSAP is registered (ADR-0004). Effects import it from here and run in `useGSAP`,
// which undoes them when the page goes away. A phone's address bar resizing the window is not a
// reason to measure every scene again.
gsap.registerPlugin(useGSAP, ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

/** The query under which every scene runs: without it the page stays as the HTML has it. */
export const MOTION_ALLOWED = "(prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, useGSAP };
