"use client";

import { Highlight, themes } from "prism-react-renderer";

/**
 * Syntax-highlighted, line-numbered code view. Re-tokenizes on each streamed
 * chunk — fine for a single component file and gives the live "typing" feel.
 */
export function CodeBlock({ code, language = "tsx" }: { code: string; language?: "tsx" | "json" }) {
  return (
    <Highlight code={code} language={language} theme={themes.vsDark}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} font-mono text-[13px] leading-relaxed`}
          style={{ ...style, background: "transparent", margin: 0 }}
        >
          {tokens.map((line, lineIndex) => {
            const lineProps = getLineProps({ line });
            return (
              <div key={lineIndex} {...lineProps} className="table-row">
                <span className="table-cell select-none pr-4 text-right text-slate-600">
                  {lineIndex + 1}
                </span>
                <span className="table-cell whitespace-pre-wrap break-words">
                  {line.map((token, tokenIndex) => {
                    const tokenProps = getTokenProps({ token });
                    return <span key={tokenIndex} {...tokenProps} />;
                  })}
                </span>
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
