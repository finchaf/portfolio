import TYPING from "./latex-typing.json";

/**
 * What the PDF shows at each compile of the typed line: TeX's own outlines, laid out by LuaLaTeX
 * and drawn in the colour of the text around them. The glyphs are shared by every compile.
 */
export function TypingRenders() {
  const glyphs = Object.entries(TYPING.glyphs);
  const [view] = TYPING.renders.slice(-1).map((render) => render.viewBox);
  return (
    <>
      <svg aria-hidden className="pj-tx-glyphs" height="0" width="0">
        <defs>
          {glyphs.map(([id, d]) => (
            <path d={d} id={`tx-${id}`} key={id} />
          ))}
        </defs>
      </svg>
      {TYPING.renders.map((render, index) => (
        <svg
          aria-hidden
          className="pj-tx-render"
          data-render={index}
          key={index}
          // Every compile lies on the same page, so the last one's box holds them all in place.
          viewBox={view}
        >
          {render.marks.map(([id, x, y], at) => (
            <use href={`#tx-${String(id)}`} key={at} x={x} y={y} />
          ))}
          {(render.rules as number[][]).map(([x, y, height, width], at) => (
            <rect height={height} key={`r${String(at)}`} width={width} x={x} y={y} />
          ))}
        </svg>
      ))}
    </>
  );
}

export const TYPING_STEPS = TYPING.steps;
