"use client";

import { useMemo } from "react";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Lightweight, dependency-free JSON syntax highlighter. Takes a JSON string and
 * wraps tokens in spans styled by `globals.css`. Safe: the input is HTML-escaped
 * before any markup is injected.
 */
function highlight(json: string): string {
  const escaped = escapeHtml(json);
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "tok-num";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "tok-key" : "tok-string";
      } else if (/true|false|null/.test(match)) {
        cls = "tok-bool";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export function JsonHighlight({ value }: { value: string }) {
  const html = useMemo(() => highlight(value), [value]);
  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed">
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}
