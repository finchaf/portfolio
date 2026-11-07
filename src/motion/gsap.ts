"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// The one place GSAP is registered (ADR-0004). Effects import it from here and run in `useScene`
// (scene.ts), which takes them down when the page goes away. A phone's address bar resizing the
// window is not a reason to measure every scene again.
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

export { MOTION_ALLOWED } from "./reduced";

export { gsap, ScrollTrigger, SplitText };
