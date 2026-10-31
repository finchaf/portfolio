/** What in a line of source is a tag, a string, an expression or a variable. */
const TOKEN = /(<\/?\w+|\/?>|"[^"]*"|\{[^}]*\}|--[\w-]+)/;

function tone(part: string): string | undefined {
  if (part.startsWith("<") || part.endsWith(">") || part.startsWith("--")) return "text-accent";
  if (part.startsWith('"')) return "text-success";
  if (part.startsWith("{")) return "text-ink";
  return undefined;
}

export interface CodeSourceProps {
  lines: readonly string[];
  className?: string;
}

/** Lines of real source, coloured the way an editor would: a picture, for the code layer. */
export function CodeSource({ lines, className = "" }: CodeSourceProps) {
  return (
    <pre className={`code-source ${className}`}>
      {lines.map((line) => (
        <code className="block" key={line}>
          {line.split(TOKEN).map((part, index) => (
            <span className={tone(part)} key={index}>
              {part}
            </span>
          ))}
        </code>
      ))}
    </pre>
  );
}
