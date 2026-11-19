"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps pages shown inside the league website's iframe. Tells the parent page how tall the content
 * is (so the frame can fit it) and when a new page loads (so it can scroll the frame into view).
 * The optional snippet script on the parent page listens for these messages.
 */
export function EmbedFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.parent === window) return;
    const send = (type: string) =>
      window.parent.postMessage({ type, height: Math.ceil(el.getBoundingClientRect().height) + 4 }, "*");
    send("rwcll-sponsor-page");
    const observer = new ResizeObserver(() => send("rwcll-sponsor-height"));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {/* The league website provides the page background. */}
      <style>{"html,body{background:transparent!important;min-height:0!important;height:auto!important}"}</style>
      {children}
    </div>
  );
}
