import { useEffect, useRef, useState } from "react";
import { createGame, press, release, scoreOf, step, type Game, type Level } from "../game/engine";

// Green Squares: draws the engine (src/game/engine.ts) on a canvas. Game state lives in refs and changes every
// frame; React state only changes on rare events (a square collected, start, game over), never per frame.
// Nothing moves until the player starts a run, and the run pauses when the tab is hidden.

const HEIGHT = 180;
const BEST_KEY = "green-squares-best";
const GRAPH_CELLS = 7 * 20; // seven rows like GitHub's graph, newest squares on the right
const RESTART_DELAY_MS = 600; // presses right after a crash are ignored, so mashing jump doesn't skip the result

type Colors = { fg: string; muted: string; line: string; danger: string; levels: [string, string, string, string] };

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mixes two hex colors like CSS color-mix(in srgb, a p%, b). Falls back to `a` if either is not a hex color. */
function mix(a: string, b: string, p: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  if (!x || !y) return a;
  const c = x.map((v, i) => Math.round(v * p + y[i] * (1 - p)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function readColors(el: Element): Colors {
  const css = getComputedStyle(el);
  const v = (name: string) => css.getPropertyValue(name).trim();
  const green = v("--c-ai-label") || "#2f9e5b";
  const bg = v("--bg") || "#101114";
  return {
    fg: v("--fg") || "#f1f2f4",
    muted: v("--muted") || "#9a9ea7",
    line: v("--line") || "#2a2c33",
    danger: v("--danger") || "#f29b9b",
    // The same four shades as the contribution graph on the home page, in green.
    levels: [mix(green, bg, 0.35), mix(green, bg, 0.55), mix(green, bg, 0.78), green],
  };
}

function readBest(): number {
  try {
    const n = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function saveBest(n: number) {
  try {
    localStorage.setItem(BEST_KEY, String(n));
  } catch {
    /* private mode: the best score just won't persist */
  }
}

function draw(ctx: CanvasRenderingContext2D, g: Game, c: Colors, paused: boolean) {
  const { width: w, height: h, groundY } = g;
  ctx.clearRect(0, 0, w, h);
  const mono = "11px 'IBM Plex Mono', ui-monospace, monospace";

  // Ground, with ticks that scroll so speed is visible.
  ctx.fillStyle = c.line;
  ctx.fillRect(0, groundY, w, 1);
  const off = g.distance % 40;
  for (let x = -off; x < w; x += 40) ctx.fillRect(x, groundY + 6, 10, 1);

  // Squares.
  for (const s of g.squares) {
    ctx.fillStyle = c.levels[s.level - 1];
    ctx.beginPath();
    ctx.roundRect(s.x, s.y, s.size, s.size, 2);
    ctx.fill();
  }

  // Obstacles: bugs on the ground, 503 banners hanging from the top.
  for (const o of g.obstacles) {
    if (o.kind === "bug") {
      const cx = o.x + o.w / 2;
      ctx.strokeStyle = c.danger;
      ctx.lineWidth = 1.5;
      for (const dy of [0.35, 0.6, 0.85]) {
        const y = o.y + o.h * dy;
        ctx.beginPath();
        ctx.moveTo(o.x - 3, y + 2);
        ctx.lineTo(o.x + o.w + 3, y - 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx - 3, o.y + 2);
      ctx.lineTo(cx - 6, o.y - 4);
      ctx.moveTo(cx + 3, o.y + 2);
      ctx.lineTo(cx + 6, o.y - 4);
      ctx.stroke();
      ctx.fillStyle = c.danger;
      ctx.beginPath();
      ctx.ellipse(cx, o.y + o.h / 2 + 1, o.w / 2 - 1, o.h / 2 - 1, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = c.danger;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = c.danger;
      ctx.lineWidth = 1;
      ctx.strokeRect(o.x + 0.5, o.y - 1, o.w - 1, o.h + 0.5);
      ctx.fillStyle = c.danger;
      ctx.font = mono;
      ctx.textAlign = "center";
      ctx.fillText("503", o.x + o.w / 2, o.y + o.h - 7);
    }
  }

  // Player: a small block with eyes that look up while jumping.
  const p = g.player;
  ctx.fillStyle = c.fg;
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, p.h, 4);
  ctx.fill();
  ctx.fillStyle = c.levels[3];
  const look = p.onGround ? 0 : -2;
  ctx.fillRect(p.x + p.w - 8, p.y + 5 + look, 3, 3);
  ctx.fillRect(p.x + p.w - 4, p.y + 5 + look, 3, 3);

  // Score.
  ctx.font = mono;
  ctx.fillStyle = c.muted;
  ctx.textAlign = "left";
  ctx.fillText(`Score ${scoreOf(g)}`, 10, 18);
  ctx.textAlign = "right";
  ctx.fillText(`Best ${Math.max(g.best, scoreOf(g))}`, w - 10, 18);

  // Messages.
  const message =
    g.phase === "ready" ? "Press Space or tap to start" :
    g.phase === "over" ? `Build failed. Score ${scoreOf(g)}. Press Space or tap to try again` :
    paused ? "Paused. Press Space or tap to continue" : "";
  if (message) {
    ctx.fillStyle = c.fg;
    ctx.textAlign = "center";
    ctx.font = "14px Archivo, 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText(message, w / 2, groundY / 2 + 6, w - 24);
  }
}

export default function GreenSquares({ autoFocus = false }: { autoFocus?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game | null>(null);
  const colors = useRef<Colors | null>(null);
  const paused = useRef(false);
  const frame = useRef(0);
  const last = useRef(0);
  const overAt = useRef(0);
  const [collected, setCollected] = useState<Level[]>([]);
  const [announce, setAnnounce] = useState("");

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;

    const g = createGame(Math.max(280, el.clientWidth), HEIGHT);
    g.best = readBest();
    game.current = g;
    colors.current = readColors(el);

    const render = () => {
      if (game.current && colors.current) draw(ctx, game.current, colors.current, paused.current);
    };

    const resize = () => {
      const width = Math.max(280, Math.floor(el.clientWidth));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.floor(width * dpr);
      cv.height = Math.floor(HEIGHT * dpr);
      cv.style.width = `${width}px`;
      cv.style.height = `${HEIGHT}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.width = width;
      render();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Follow the site's light/dark theme.
    const recolor = () => {
      colors.current = readColors(el);
      render();
    };
    const mo = new MutationObserver(recolor);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", recolor);

    const onHidden = () => {
      if (document.hidden && g.phase === "running") {
        paused.current = true;
        cancelAnimationFrame(frame.current);
        render();
      }
    };
    document.addEventListener("visibilitychange", onHidden);

    if (autoFocus) el.focus({ preventScroll: true });

    return () => {
      cancelAnimationFrame(frame.current);
      ro.disconnect();
      mo.disconnect();
      mq.removeEventListener("change", recolor);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [autoFocus]);

  function loop(now: number) {
    const g = game.current;
    const ctx = canvas.current?.getContext("2d");
    if (!g || !ctx || !colors.current) return;
    const dt = Math.min((now - last.current) / 1000, 1 / 30); // a long frame never teleports the player
    last.current = now;
    for (const e of step(g, dt)) {
      if (e.type === "collect") setCollected((list) => [...list, e.level].slice(-GRAPH_CELLS));
      if (e.type === "over") {
        overAt.current = performance.now();
        saveBest(g.best);
        setAnnounce(`Build failed. Score ${e.score}. Best ${g.best}.`);
      }
    }
    draw(ctx, g, colors.current, false);
    if (g.phase === "running") frame.current = requestAnimationFrame(loop);
  }

  function onPress() {
    const g = game.current;
    if (!g) return;
    if (g.phase === "over" && performance.now() - overAt.current < RESTART_DELAY_MS) return;
    if (paused.current) {
      paused.current = false;
    } else {
      const wasOver = g.phase === "over";
      const wasReady = g.phase === "ready";
      press(g);
      if (wasOver || wasReady) {
        setCollected([]);
        setAnnounce("Run started.");
      }
    }
    cancelAnimationFrame(frame.current);
    last.current = performance.now();
    frame.current = requestAnimationFrame(loop);
  }

  function onRelease() {
    if (game.current) release(game.current);
  }

  const isJumpKey = (k: string) => k === " " || k === "ArrowUp" || k === "w" || k === "W";

  // Newest squares on the right, filled column by column like GitHub's graph.
  const cells: (Level | 0)[] = Array.from({ length: GRAPH_CELLS }, (_, i) => collected[i - (GRAPH_CELLS - collected.length)] ?? 0);

  return (
    <div className="gs">
      <div
        ref={wrap}
        className="gs-stage"
        tabIndex={0}
        role="application"
        aria-label="Green Squares game. Press Space, Up arrow or W to jump, or tap. Hold to jump higher."
        onKeyDown={(e) => {
          if (!isJumpKey(e.key)) return;
          e.preventDefault(); // keep Space from scrolling the page while playing
          if (!e.repeat) onPress();
        }}
        onKeyUp={(e) => {
          if (isJumpKey(e.key)) onRelease();
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          wrap.current?.focus({ preventScroll: true });
          onPress();
        }}
        onPointerUp={onRelease}
        onPointerCancel={onRelease}
      >
        <canvas ref={canvas} aria-hidden="true" />
      </div>
      <p className="sr-only" aria-live="polite">{announce}</p>
      <div className="gs-graph" aria-label={`Squares collected this run: ${collected.length}`} role="img">
        {cells.map((l, i) => (
          <i key={i} className="cell" data-g={l} />
        ))}
      </div>
      <p className="gs-count">
        {collected.length} {collected.length === 1 ? "square" : "squares"} this run
      </p>
    </div>
  );
}
