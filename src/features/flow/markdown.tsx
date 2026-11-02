import { ExternalLink, Info } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The part of Obsidian's Markdown the vault uses, rendered on the server: headings, lists, tables,
 * code, callouts, quotes, embeds as `![[name]]`, wiki links, tags and a heading's `^block-id`.
 */
const INLINE =
  /(`[^`]+`)|(\*\*.+?\*\*)|(\[\[[\w-]+(?:\|[^\]]+)?\]\])|(\[[^\]]+\]\([^)]+\))|((?<=^|\s)#[\p{L}\d_-]+)/gu;

export function WikiLink({ note, children }: { note: string; children: ReactNode }) {
  return (
    <a className="internal-link" data-note={note} href={`#${note}`}>
      {children}
    </a>
  );
}

/** Text with its inline marks. */
export function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let at = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > at) parts.push(text.slice(at, match.index));
    const [token, code, bold, wiki, link, tag] = match;
    const key = match.index;
    if (code) parts.push(<code key={key}>{code.slice(1, -1)}</code>);
    else if (bold) {
      parts.push(
        <strong key={key}>
          <Inline text={bold.slice(2, -2)} />
        </strong>,
      );
    } else if (wiki) {
      const [note = "", label] = wiki.slice(2, -2).split("|");
      parts.push(
        <WikiLink key={key} note={note}>
          {label ?? note}
        </WikiLink>,
      );
    } else if (link) {
      const split = link.indexOf("](");
      parts.push(
        <a className="external-link" href={link.slice(split + 2, -1)} key={key}>
          {link.slice(1, split)}
          <ExternalLink aria-hidden size={12} />
        </a>,
      );
    } else if (tag) {
      parts.push(
        <span className="tag" data-tag={tag.slice(1)} key={key}>
          {tag}
        </span>,
      );
    }
    at = match.index + token.length;
  }
  if (at < text.length) parts.push(text.slice(at));
  return <>{parts}</>;
}

type Block =
  | { kind: "heading"; level: number; text: string; scene?: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "table"; head: string[]; numeric: boolean[]; rows: string[][] }
  | { kind: "code"; text: string }
  | { kind: "callout"; title: string; text: string }
  | { kind: "quote"; text: string }
  | { kind: "embed"; name: string };

const cells = (line: string) =>
  line
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());

function isBlockStart(line: string) {
  return /^(#{2,3} |- |\d+\. |\||```|> |!\[\[)/.test(line);
}

/** Lines into blocks. */
export function parseBlocks(source: string): Block[] {
  const lines = source.split("\n");
  const blocks: Block[] = [];
  let index = 0;
  const take = (test: (line: string) => boolean) => {
    const taken: string[] = [];
    while (index < lines.length && test(lines[index] ?? "")) taken.push(lines[index++] ?? "");
    return taken;
  };
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (line.trim() === "") {
      index += 1;
    } else if (line.startsWith("#")) {
      index += 1;
      const [, marks = "", text = "", scene] = /^(#+) (.*?)(?: \^scene-(\d))?$/.exec(line) ?? [];
      blocks.push({ kind: "heading", level: marks.length, text, scene });
    } else if (line.startsWith("- ")) {
      const items = take((each) => each.startsWith("- ")).map((each) => each.slice(2));
      blocks.push({ kind: "list", ordered: false, items });
    } else if (/^\d+\. /.test(line)) {
      const items = take((each) => /^\d+\. /.test(each)).map((each) => each.replace(/^\d+\. /, ""));
      blocks.push({ kind: "list", ordered: true, items });
    } else if (line.startsWith("|")) {
      const [head = "", rule = "", ...rows] = take((each) => each.startsWith("|"));
      blocks.push({
        kind: "table",
        head: cells(head),
        numeric: cells(rule).map((cell) => cell.endsWith(":")),
        rows: rows.map(cells),
      });
    } else if (line.startsWith("```")) {
      index += 1;
      const code = take((each) => !each.startsWith("```"));
      index += 1;
      blocks.push({ kind: "code", text: code.join("\n") });
    } else if (line.startsWith("> ")) {
      const quote = take((each) => each.startsWith("> ")).map((each) => each.slice(2));
      const callout = /^\[!info\] (.*)$/.exec(quote[0] ?? "");
      if (callout) {
        blocks.push({ kind: "callout", title: callout[1] ?? "", text: quote.slice(1).join(" ") });
      } else blocks.push({ kind: "quote", text: quote.join(" ") });
    } else if (line.startsWith("![[")) {
      index += 1;
      blocks.push({ kind: "embed", name: line.slice(3, -2) });
    } else {
      const text = take((each) => each.trim() !== "" && !isBlockStart(each)).join(" ");
      blocks.push({ kind: "paragraph", text });
    }
  }
  return blocks;
}

/**
 * A note's Markdown. `depth` lifts its headings: under the page's one `h1` a side note starts a
 * level lower.
 */
export function Markdown({
  source,
  embeds,
  depth,
}: {
  source: string;
  embeds: Record<string, ReactNode>;
  depth: number;
}) {
  return parseBlocks(source).map((block, index) => {
    switch (block.kind) {
      case "heading": {
        const Tag = `h${String(Math.min(block.level + depth, 6))}` as "h2" | "h3" | "h4";
        return (
          <Tag
            className={`md-h${String(block.level)}`}
            data-outline=""
            data-scene={block.scene}
            key={index}
          >
            <Inline text={block.text} />
          </Tag>
        );
      }
      case "paragraph":
        return (
          <p key={index}>
            <Inline text={block.text} />
          </p>
        );
      case "list": {
        const items = block.items.map((item) => (
          <li key={item}>
            <Inline text={item} />
          </li>
        ));
        return block.ordered ? (
          <ol key={index}>{items}</ol>
        ) : (
          <ul data-list="" key={index}>
            {items}
          </ul>
        );
      }
      case "table":
        return (
          <div className="table-wrap" key={index}>
            <table>
              <thead>
                <tr>
                  {block.head.map((cell, column) => (
                    <th data-numeric={block.numeric[column] ? "" : undefined} key={cell}>
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.join()}>
                    {row.map((cell, column) => (
                      <td data-numeric={block.numeric[column] ? "" : undefined} key={column}>
                        <Inline text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "code":
        return (
          <pre className="code-block" key={index}>
            <code>{block.text}</code>
          </pre>
        );
      case "callout":
        return (
          <div className="callout" key={index}>
            <p className="callout-title">
              <Info aria-hidden size={18} />
              {block.title}
            </p>
            <p>
              <Inline text={block.text} />
            </p>
          </div>
        );
      case "quote":
        return (
          <blockquote key={index}>
            <Inline text={block.text} />
          </blockquote>
        );
      case "embed":
        return <div key={index}>{embeds[block.name]}</div>;
    }
  });
}
