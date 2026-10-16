import { useEffect, useRef, useState } from "react";

type Mode = "light" | "dark";
const KEY = "theme";

const systemMode = (): Mode =>
  window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";

function readStored(): Mode | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>(() => readStored() ?? systemMode());
  const stored = useRef<Mode | null>(readStored());
  const btn = useRef<HTMLButtonElement>(null);

  // Apply a saved choice on load; otherwise follow the system and keep following it.
  useEffect(() => {
    if (stored.current) document.documentElement.dataset.theme = stored.current;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (!stored.current) setMode(systemMode());
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function apply(next: Mode) {
    document.documentElement.dataset.theme = next;
    stored.current = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode: choice just won't persist */
    }
    setMode(next);
  }

  function toggle() {
    const next: Mode = mode === "dark" ? "light" : "dark";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };

    if (reduce) {
      apply(next);
      return;
    }

    if (doc.startViewTransition) {
      const r = btn.current!.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const t = doc.startViewTransition(() => apply(next));
      t.ready
        .then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 650, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
          );
        })
        .catch(() => {});
      return;
    }

    root.classList.add("theme-anim");
    apply(next);
    window.setTimeout(() => root.classList.remove("theme-anim"), 500);
  }

  return (
    <button
      ref={btn}
      className="theme-btn"
      type="button"
      data-mode={mode}
      onClick={toggle}
      aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={mode === "dark" ? "Light theme" : "Dark theme"}
    >
      <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
      </svg>
      <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
    </button>
  );
}
