import { ScrollTrigger } from "@/motion/gsap";
import { SCENE } from "@/motion/tokens";

/**
 * How a scene's scrub follows the scroll: a touch screen moves it with the finger, a mouse wheel
 * lets it catch up over `SCENE.catchUp`. A function, since ScrollTrigger knows a touch screen only
 * once the page runs: a scene asks while it is built.
 */
export const scrubFollow = () => (ScrollTrigger.isTouch === 1 ? true : SCENE.catchUp);
