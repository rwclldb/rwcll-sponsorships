"use client";

import { useState } from "react";

/** A read-only text box with a Copy button. */
export function CopyBox({ text, rows = 8 }: { text: string; rows?: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2">
      <textarea
        readOnly
        rows={rows}
        value={text}
        onFocus={(e) => e.currentTarget.select()}
        className="input font-mono text-xs"
      />
      <button
        type="button"
        className="btn-secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}
