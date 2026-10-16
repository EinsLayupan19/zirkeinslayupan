// Green Squares: the game logic, with no drawing and no browser APIs, so it can be tested on its own.
// Coordinates are canvas pixels (y grows downward). The canvas component calls step() once per frame.

export type Phase = "ready" | "running" | "over";
export type Level = 1 | 2 | 3 | 4;
export type Obstacle = { kind: "bug" | "503"; x: number; y: number; w: number; h: number };
export type Square = { x: number; y: number; size: number; level: Level };
export type GameEvent = { type: "collect"; level: Level } | { type: "over"; score: number };

export const CONFIG = {
  gravity: 2200, // px/s²
  jumpVelocity: 680, // px/s; a full jump rises about 105 px and stays up about 0.6 s
  cutVelocity: 260, // letting go early caps the upward speed here, for a short hop
  startSpeed: 260, // px/s
  acceleration: 12, // px/s per second
  maxSpeed: 620,
  minGap: 230, // px between obstacles, before the speed-based extra
  gapSpread: 280,
  flyersAfter: 1500, // px of distance before 503s start to appear
  flyerChance: 0.3,
  flyerBottomGap: 26, // 503 banners hang from the top to here: a standing player (18 px) passes under, a jump hits
  pointsPerLevel: 5, // a level-3 square is worth 15
  distancePerPoint: 10,
  squareSize: 12,
  hitInset: 3, // forgiving collisions: obstacle boxes shrink by this much
  referenceWidth: 600, // game areas narrower than this run proportionally slower (down to 55%), for equal reaction time
} as const;

/** Speed multiplier for a game area of this width. */
export function speedScale(width: number): number {
  return Math.min(1, Math.max(0.55, width / CONFIG.referenceWidth));
}

type Player = { x: number; y: number; w: number; h: number; vy: number; onGround: boolean };

export type Game = {
  width: number;
  height: number;
  groundY: number;
  phase: Phase;
  time: number;
  speed: number;
  distance: number;
  points: number;
  best: number;
  player: Player;
  obstacles: Obstacle[];
  squares: Square[];
  collected: Level[];
  nextObstacleIn: number;
  nextSquareIn: number;
  rand: () => number;
};

/** Small seeded random generator (mulberry32), so a seed always gives the same course. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function freshRun(g: Pick<Game, "groundY" | "width">) {
  return {
    phase: "ready" as Phase,
    time: 0,
    speed: CONFIG.startSpeed * speedScale(g.width),
    distance: 0,
    points: 0,
    player: { x: 48, y: g.groundY - 18, w: 18, h: 18, vy: 0, onGround: true },
    obstacles: [] as Obstacle[],
    squares: [] as Square[],
    collected: [] as Level[],
    nextObstacleIn: g.width * 0.6,
    nextSquareIn: g.width * 0.35,
  };
}

export function createGame(width: number, height: number, seed = Date.now()): Game {
  const groundY = height - 24;
  return { width, height, groundY, best: 0, rand: seeded(seed), ...freshRun({ groundY, width }) };
}

export function scoreOf(g: Game): number {
  return Math.floor(g.distance / CONFIG.distancePerPoint) + g.points;
}

function jump(g: Game) {
  if (!g.player.onGround) return;
  g.player.vy = -CONFIG.jumpVelocity;
  g.player.onGround = false;
}

/** Jump button pressed: starts the game, jumps, or restarts after a game over. */
export function press(g: Game) {
  if (g.phase === "over") Object.assign(g, freshRun(g));
  if (g.phase === "ready") g.phase = "running";
  jump(g);
}

/** Jump button released: an early release turns a full jump into a short hop. */
export function release(g: Game) {
  if (g.player.vy < -CONFIG.cutVelocity) g.player.vy = -CONFIG.cutVelocity;
}

function pickLevel(r: number): Level {
  return r < 0.45 ? 1 : r < 0.75 ? 2 : r < 0.92 ? 3 : 4;
}

/** The smallest distance between obstacles at a given speed (before randomness and the obstacle's width). */
export function minGapAt(speed: number): number {
  return CONFIG.minGap + speed * 0.35;
}

function spawnObstacle(g: Game) {
  const flyer = g.distance >= CONFIG.flyersAfter && g.rand() < CONFIG.flyerChance;
  const x = g.width + 20;
  if (flyer) {
    g.obstacles.push({ kind: "503", x, y: 0, w: 34, h: g.groundY - CONFIG.flyerBottomGap });
  } else {
    const w = 16 + Math.floor(g.rand() * 7);
    const h = 14 + Math.floor(g.rand() * 7);
    g.obstacles.push({ kind: "bug", x, y: g.groundY - h, w, h });
  }
  const placed = g.obstacles[g.obstacles.length - 1];
  g.nextObstacleIn = minGapAt(g.speed) + g.rand() * CONFIG.gapSpread + placed.w;
}

function spawnSquares(g: Game) {
  const size = CONFIG.squareSize;
  const top = g.groundY - 110; // the highest a full jump can reach
  const bottom = g.groundY - size - 2;
  const y = top + g.rand() * (bottom - top);
  const count = g.rand() < 0.3 ? 3 : 1;
  for (let i = 0; i < count; i++) g.squares.push({ x: g.width + 20 + i * (size + 6), y, size, level: pickLevel(g.rand()) });
  g.nextSquareIn = 140 + g.rand() * 220 + count * (size + 6);
}

const overlaps = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Advances the game by dt seconds and reports what happened. Does nothing unless the game is running. */
export function step(g: Game, dt: number): GameEvent[] {
  if (g.phase !== "running") return [];
  const events: GameEvent[] = [];

  g.time += dt;
  const scale = speedScale(g.width);
  g.speed = Math.min(CONFIG.maxSpeed * scale, g.speed + CONFIG.acceleration * scale * dt);
  const dx = g.speed * dt;
  g.distance += dx;

  const p = g.player;
  if (!p.onGround) {
    p.vy += CONFIG.gravity * dt;
    p.y += p.vy * dt;
    if (p.y >= g.groundY - p.h) {
      p.y = g.groundY - p.h;
      p.vy = 0;
      p.onGround = true;
    }
  }

  for (const o of g.obstacles) o.x -= dx;
  for (const s of g.squares) s.x -= dx;
  g.obstacles = g.obstacles.filter((o) => o.x + o.w > -10);
  g.squares = g.squares.filter((s) => s.x + s.size > -10);

  g.nextObstacleIn -= dx;
  if (g.nextObstacleIn <= 0) spawnObstacle(g);
  g.nextSquareIn -= dx;
  if (g.nextSquareIn <= 0) spawnSquares(g);

  const kept: Square[] = [];
  for (const s of g.squares) {
    if (overlaps(p, { x: s.x, y: s.y, w: s.size, h: s.size })) {
      g.collected.push(s.level);
      g.points += s.level * CONFIG.pointsPerLevel;
      events.push({ type: "collect", level: s.level });
    } else kept.push(s);
  }
  g.squares = kept;

  const i = CONFIG.hitInset;
  if (g.obstacles.some((o) => overlaps(p, { x: o.x + i, y: o.y + i, w: o.w - 2 * i, h: o.h - 2 * i }))) {
    g.phase = "over";
    const score = scoreOf(g);
    g.best = Math.max(g.best, score);
    events.push({ type: "over", score });
  }
  return events;
}
