import "./board.css";

import type { StaticImageData } from "next/image";

import { Image } from "../image";

import docCoverDark from "./paper/doc-cover-dark.avif";
import docCoverLight from "./paper/doc-cover-light.avif";
import docRegistryDark from "./paper/doc-registry-dark.avif";
import docRegistryLight from "./paper/doc-registry-light.avif";
import docSourcesDark from "./paper/doc-sources-dark.avif";
import docSourcesLight from "./paper/doc-sources-light.avif";
import notesCalculusDark from "./paper/notes-calculus-dark.avif";
import notesCalculusLight from "./paper/notes-calculus-light.avif";
import notesContourDark from "./paper/notes-contour-dark.webp";
import notesContourLight from "./paper/notes-contour-light.avif";
import notesGraphsDark from "./paper/notes-graphs-dark.avif";
import notesGraphsLight from "./paper/notes-graphs-light.avif";
import notesProofsDark from "./paper/notes-proofs-dark.avif";
import notesProofsLight from "./paper/notes-proofs-light.avif";
import notesSphereDark from "./paper/notes-sphere-dark.webp";
import notesSphereLight from "./paper/notes-sphere-light.avif";
import notesTaylorDark from "./paper/notes-taylor-dark.webp";
import notesTaylorLight from "./paper/notes-taylor-light.avif";
import thesis69Dark from "./paper/thesis-69-dark.avif";
import thesis69Light from "./paper/thesis-69-light.avif";
import wallV202605122Dark from "./paper/wall-v2026.05.12.2-dark.avif";
import wallV202605122Light from "./paper/wall-v2026.05.12.2-light.avif";
import wallV20260512Dark from "./paper/wall-v2026.05.12-dark.avif";
import wallV20260512Light from "./paper/wall-v2026.05.12-light.avif";
import wallV20260518Dark from "./paper/wall-v2026.05.18-dark.webp";
import wallV20260518Light from "./paper/wall-v2026.05.18-light.webp";
import wallV202605192Dark from "./paper/wall-v2026.05.19.2-dark.webp";
import wallV202605192Light from "./paper/wall-v2026.05.19.2-light.webp";
import wallV20260519Dark from "./paper/wall-v2026.05.19-dark.webp";
import wallV20260519Light from "./paper/wall-v2026.05.19-light.webp";
import wallV20260520Dark from "./paper/wall-v2026.05.20-dark.webp";
import wallV20260520Light from "./paper/wall-v2026.05.20-light.webp";
import wallV20260522Dark from "./paper/wall-v2026.05.22-dark.webp";
import wallV20260522Light from "./paper/wall-v2026.05.22-light.webp";
import wallV20260604Dark from "./paper/wall-v2026.06.04-dark.webp";
import wallV20260604Light from "./paper/wall-v2026.06.04-light.webp";
import wallV20260608Dark from "./paper/wall-v2026.06.08-dark.webp";
import wallV20260608Light from "./paper/wall-v2026.06.08-light.webp";
import wallV20260610Dark from "./paper/wall-v2026.06.10-dark.webp";
import wallV20260610Light from "./paper/wall-v2026.06.10-light.webp";

/**
 * Pages of the project's PDFs, in both modes. The dark one is the page as the owner's Zathura showed
 * it, recoloured into Catppuccin Mocha; `docs/private` holds the script that renders them.
 */
export const PAPER = {
  "doc-cover": [docCoverLight, docCoverDark],
  "doc-registry": [docRegistryLight, docRegistryDark],
  "doc-sources": [docSourcesLight, docSourcesDark],
  "notes-calculus": [notesCalculusLight, notesCalculusDark],
  "notes-contour": [notesContourLight, notesContourDark],
  "notes-graphs": [notesGraphsLight, notesGraphsDark],
  "notes-proofs": [notesProofsLight, notesProofsDark],
  "notes-sphere": [notesSphereLight, notesSphereDark],
  "notes-taylor": [notesTaylorLight, notesTaylorDark],
  "thesis-69": [thesis69Light, thesis69Dark],
  "wall-v2026.05.12": [wallV20260512Light, wallV20260512Dark],
  "wall-v2026.05.12.2": [wallV202605122Light, wallV202605122Dark],
  "wall-v2026.05.18": [wallV20260518Light, wallV20260518Dark],
  "wall-v2026.05.19": [wallV20260519Light, wallV20260519Dark],
  "wall-v2026.05.19.2": [wallV202605192Light, wallV202605192Dark],
  "wall-v2026.05.20": [wallV20260520Light, wallV20260520Dark],
  "wall-v2026.05.22": [wallV20260522Light, wallV20260522Dark],
  "wall-v2026.06.04": [wallV20260604Light, wallV20260604Dark],
  "wall-v2026.06.08": [wallV20260608Light, wallV20260608Dark],
  "wall-v2026.06.10": [wallV20260610Light, wallV20260610Dark],
} satisfies Record<string, [StaticImageData, StaticImageData]>;

export type PaperName = keyof typeof PAPER;

/** A page in the reader's mode: both are in the HTML, and the hidden one is never fetched. */
export function Paper({ name, alt = "", sizes }: { name: PaperName; alt?: string; sizes: string }) {
  const [light, dark] = PAPER[name];
  return (
    <>
      <Image
        alt={alt}
        className="pj-only-light"
        draggable={false}
        loading="lazy"
        sizes={sizes}
        src={light}
        unoptimized
      />
      <Image
        alt={alt}
        className="pj-only-dark"
        draggable={false}
        loading="lazy"
        sizes={sizes}
        src={dark}
        unoptimized
      />
    </>
  );
}
