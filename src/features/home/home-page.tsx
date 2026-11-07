import "./scenes.css";

import { World } from "@/ui/world";

import { Experience } from "./experience";
import { Finale } from "./finale";
import { Hero } from "./hero";
import { PersonData } from "./person-data";
import { Story } from "./story";
import { Work } from "./work";

/** A scene in which the axis of movement changes: down, around a wheel, across the works, down. */
export function HomePage() {
  return (
    <World name="home">
      <PersonData />
      <Hero />
      <Story />
      <Work />
      <div className="work-after" data-after-work>
        <Experience />
        <Finale />
      </div>
    </World>
  );
}
