import "./scenes.css";

import { World } from "@/ui/world";

import { Hero } from "./hero";
import { PersonData } from "./person-data";

/** A scene in which the axis of movement changes: down, sideways, into depth, onto a stack. */
export function HomePage() {
  return (
    <World bleed name="home">
      <PersonData />
      <Hero />
    </World>
  );
}
