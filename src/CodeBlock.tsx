import type { Language } from './types.ts';

const tokens = /(\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:abstract|class|interface|implements|extends|constructor|private|protected|public|static|final|readonly|return|new|this|if|else|for|of|void|int|double|boolean|string|number|const|let|type|import|from|try|finally|throw|function|record|package|yield)\b|\b(?:true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g;
export function CodeBlock({ code, language }: { code: string; language: Language }) {
  return <div className="code-frame">
    <div className="code-caption"><span className="code-dots">● ● ●</span><span>{language === 'java' ? 'Example.java · Java 17+' : 'example.ts · TypeScript'}</span></div>
    <pre tabIndex={0} aria-label={`${language} code example`}><code>{code.split('\n').map((line, i) =>
      <span className="code-line" key={i}><span className="line-number" aria-hidden="true">{i + 1}</span><span>{line.split(tokens).map((token, j) => {
        const cls = token.startsWith('//') ? 'comment' : /^["']/.test(token) ? 'string' : /^\d/.test(token) ? 'number' : /^(true|false|null|undefined)$/.test(token) ? 'literal' : j % 2 ? 'keyword' : '';
        return <span className={cls} key={j}>{token}</span>;
      })}</span>{'\n'}</span>,
    )}</code></pre>
  </div>;
}
