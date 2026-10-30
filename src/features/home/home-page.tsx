import "./scenes.css";

import { World } from "@/ui/world";

import { Build } from "./build";
import { Hero } from "./hero";
import { PersonData } from "./person-data";
import { Story } from "./story";

/** A scene in which the axis of movement changes: down, sideways, into depth, onto a stack. */
export function HomePage() {
  return (
    <World bleed name="home">
      <PersonData />
      <Hero />
      <Story />
      <Build />
    </World>
  );
}
