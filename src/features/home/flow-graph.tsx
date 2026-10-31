/** Where each note stands in the graph: the steps on a ring, the base in the middle. */
const NODES = [
  { key: "brief", x: 90, y: 70 },
  { key: "research", x: 330, y: 50 },
  { key: "screens", x: 380, y: 230 },
  { key: "handoff", x: 120, y: 260 },
] as const;

const CENTRE = { x: 230, y: 160 };

export interface FlowGraphProps {
  labels: Record<(typeof NODES)[number]["key"] | "base", string>;
}

/**
 * The notes of a task joined the way a vault draws them. The scroll draws the road from note to
 * note, then the lines back to the base, which is the point of the system.
 */
export function FlowGraph({ labels }: FlowGraphProps) {
  const road = NODES.map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  return (
    <svg aria-hidden className="flow-graph" fill="none" viewBox="0 0 470 320">
      <path className="stroke-line" d={road} pathLength={1} strokeWidth="1.5" />
      <path
        className="stroke-accent"
        d={road}
        data-graph-line
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset="1"
        strokeWidth="2"
      />
      {NODES.map(({ key, x, y }) => (
        <line
          className="stroke-accent"
          data-graph-line
          key={key}
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset="1"
          strokeWidth="1.5"
          x1={x}
          x2={CENTRE.x}
          y1={y}
          y2={CENTRE.y}
        />
      ))}
      {NODES.map(({ key, x, y }) => (
        <g key={key}>
          <circle className="fill-raised stroke-line" cx={x} cy={y} r="9" />
          <text className="fill-muted font-mono text-[13px]" textAnchor="middle" x={x} y={y - 18}>
            {labels[key]}
          </text>
        </g>
      ))}
      <circle className="fill-accent" cx={CENTRE.x} cy={CENTRE.y} r="15" />
      <text
        className="fill-ink font-mono text-[13px]"
        textAnchor="middle"
        x={CENTRE.x}
        y={CENTRE.y + 36}
      >
        {labels.base}
      </text>
    </svg>
  );
}
