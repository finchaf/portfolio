/** Code as it is typed, the same in every language: what lies in the LaTeX project's frames. */

const HEAD = { snippets: "snippets/tex/", verify: "$ collect_verify.py" } as const;

/** Triggers of the owner's LuaSnip snippets and what each one becomes. */
export const SNIPPETS = [
  ["mm", "$ $"],
  ["ff", "\\frac{}{}"],
  [";e", "\\epsilon"],
  ["<=", "\\leqslant"],
  ["sbb", "\\subset"],
  ["faa", "\\forall"],
  [">>", "\\implies"],
] as const;

/** What the verifier says of a fact an agent brought: the first two are held. */
export const VERDICTS = [
  ["ok", true],
  ["values-on-page", true],
  ["quote-not-on-page", false],
  ["value-not-on-page", false],
  ["page-empty", false],
  ["tls", false],
  ["no-url", false],
  ["no-quote", false],
] as const;

export function SnippetLines() {
  return (
    <span className="pj-lines">
      <b>{HEAD.snippets}</b>
      {SNIPPETS.map(([trigger, result]) => (
        <span key={trigger}>
          <span>{trigger}</span>
          <em>{result}</em>
        </span>
      ))}
    </span>
  );
}

export function VerdictLines() {
  return (
    <span className="pj-lines">
      <b>{HEAD.verify}</b>
      {VERDICTS.map(([verdict, held]) => (
        <span key={verdict}>
          <span>{verdict}</span>
          <em data-failed={held ? undefined : ""}>{held ? "✓" : "×"}</em>
        </span>
      ))}
    </span>
  );
}
