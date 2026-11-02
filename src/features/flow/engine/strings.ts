export interface Remark {
  key: string;
  chip: string;
  quote: string;
  id: string;
  what: string;
  line: string;
}

export interface TerminalStrings {
  title: string;
  replay: string;
  notStarted: string;
  waitStyle: string;
  waitStop: string;
  intro: string;
  unknown: string;
  noFile: string;
  opened: string;
  askStyle: string;
  askStop: string;
  askStopShort: string;
  chosen: string;
  autoChosen: string;
  autoNext: string;
  alone: string;
  stage1Done: string;
  stage2Done: string;
  closed: string;
  goSay: string;
  resumed: string;
  broke: string;
  waitingFor: string;
  nothing: string;
  running: string;
  remarkAsk: string;
  freeRemark: string;
  next: string;
  editsChip: string;
  pause: string;
  play: string;
  critic: string;
  audit: string;
  rules: string;
  remarks: { menu: Remark; where: Remark; label: Remark };
  steps: Record<string, string>;
  help: Record<string, { name: string; text: string }>;
}

/** What the script of the page needs from the catalogs: a client gets its strings as props. */
export interface VaultStrings {
  ui: Record<string, string>;
  terminal: TerminalStrings;
  board: Record<string, string>;
  checklists: Record<string, string>;
  pages: { label: string; href: string }[];
  other: { label: string; locale: string };
}

export function fill(template: string, x: string, y = ""): string {
  return template.replace("{x}", x).replace("{y}", y);
}
