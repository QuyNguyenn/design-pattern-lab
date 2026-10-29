import type { ReactNode } from 'react';
import type { Language } from './types.ts';

const tokenPattern =
  /(\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:abstract|as|boolean|break|byte|case|catch|char|class|const|constructor|continue|default|do|double|else|enum|extends|final|finally|float|for|from|function|if|implements|import|instanceof|int|interface|let|long|new|null|of|package|private|protected|public|record|return|short|static|string|super|switch|this|throw|try|type|undefined|var|void|while|yield)\b|\b(?:false|true)\b|\b\d+(?:\.\d+)?\b)/g;

function tokenClass(token: string): string {
  if (token.startsWith('//')) return 'comment';
  if (/^["'`]/.test(token)) return 'string';
  if (/^\d/.test(token)) return 'number';
  if (/^(?:false|true|null|undefined)$/.test(token)) return 'literal';
  return 'keyword';
}

function highlight(line: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const [index, match] of [...line.matchAll(tokenPattern)].entries()) {
    const token = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) nodes.push(line.slice(lastIndex, start));
    nodes.push(
      <span className={tokenClass(token)} key={`${start}-${index}`}>
        {token}
      </span>,
    );
    lastIndex = start + token.length;
  }

  if (lastIndex < line.length) nodes.push(line.slice(lastIndex));
  return nodes;
}

export function CodeBlock({ code, language }: { code: string; language: Language }) {
  const fileName = language === 'java' ? 'Example.java · Java 17+' : 'example.ts · TypeScript';

  return (
    <div className="code-frame">
      <div className="code-caption">
        <span className="code-dots" aria-hidden="true">
          ● ● ●
        </span>
        <span>{fileName}</span>
      </div>
      <pre tabIndex={0} aria-label={`${language} code example`}>
        <code>
          {code.split('\n').map((line, lineNumber) => (
            <span className="code-line" key={lineNumber}>
              <span className="line-number" aria-hidden="true">
                {lineNumber + 1}
              </span>
              <span>{highlight(line)}</span>
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
      <p className="code-scroll-hint">
        Long lines? Scroll sideways, or focus the code and use arrow keys.
      </p>
    </div>
  );
}
