import { describe, expect, it } from "vitest";
import { CONFIG, createGame, minGapAt, press, release, scoreOf, step, type Game } from "./engine";

const W = 600;
const H = 180;
const run = (g: Game, seconds: number, dt = 1 / 60) => {
  const events: string[] = [];
  for (let t = 0; t < seconds; t += dt) for (const e of step(g, dt)) events.push(e.type);
  return events;
};
/** A started game with nothing on screen, so tests control exactly what is in the world. */
const clean = (seed = 1) => {
  const g = createGame(W, H, seed);
  press(g);
  g.player.vy = 0;
  g.player.y = g.groundY - g.player.h;
  g.player.onGround = true;
  g.obstacles = [];
  g.squares = [];
  g.nextObstacleIn = 1e9;
  g.nextSquareIn = 1e9;
  return g;
};

describe("start and idle", () => {
  it("waits on the ready screen without moving", () => {
    const g = createGame(W, H, 1);
    expect(g.phase).toBe("ready");
    run(g, 2);
    expect(g.distance).toBe(0);
    expect(scoreOf(g)).toBe(0);
  });

  it("the first press starts the run and jumps", () => {
    const g = createGame(W, H, 1);
    press(g);
    expect(g.phase).toBe("running");
    expect(g.player.vy).toBeLessThan(0);
  });
});

describe("jumping", () => {
  it("rises and lands back on the ground", () => {
    const g = clean();
    press(g);
    let top = g.player.y;
    for (let i = 0; i < 120; i++) { step(g, 1 / 60); top = Math.min(top, g.player.y); }
    expect(top).toBeLessThan(g.groundY - g.player.h - 60);
    expect(g.player.onGround).toBe(true);
    expect(g.player.y).toBe(g.groundY - g.player.h);
  });

  it("has no double jump", () => {
    const g = clean();
    press(g);
    step(g, 0.1);
    const vy = g.player.vy;
    press(g);
    expect(g.player.vy).toBe(vy);
  });

  it("letting go early makes a shorter jump", () => {
    const peak = (cut: boolean) => {
      const g = clean();
      press(g);
      step(g, 1 / 60);
      if (cut) release(g);
      let top = g.player.y;
      for (let i = 0; i < 120; i++) { step(g, 1 / 60); top = Math.min(top, g.player.y); }
      return g.groundY - g.player.h - top;
    };
    expect(peak(true)).toBeLessThan(peak(false) * 0.6);
  });
});

describe("collisions", () => {
  it("hitting a bug ends the run with a 'Build failed' event", () => {
    const g = clean();
    g.obstacles.push({ kind: "bug", x: g.player.x + 30, y: g.groundY - 16, w: 18, h: 16 });
    const events = run(g, 1);
    expect(events).toContain("over");
    expect(g.phase).toBe("over");
    const d = g.distance;
    run(g, 1);
    expect(g.distance).toBe(d);
  });

  it("standing still passes under a 503, jumping into it ends the run", () => {
    const under = clean();
    under.obstacles.push({ kind: "503", x: under.player.x + 40, y: 0, w: 34, h: under.groundY - CONFIG.flyerBottomGap });
    expect(run(under, 1)).not.toContain("over");

    const hit = clean();
    hit.obstacles.push({ kind: "503", x: hit.player.x + 40, y: 0, w: 34, h: hit.groundY - CONFIG.flyerBottomGap });
    press(hit);
    expect(run(hit, 1)).toContain("over");
  });

  it("collecting a square adds it to the run's graph and scores by its shade", () => {
    const g = clean();
    g.squares.push({ x: g.player.x + 20, y: g.groundY - g.player.h, size: 12, level: 3 });
    const before = scoreOf(g);
    const events = run(g, 0.5);
    expect(events).toContain("collect");
    expect(g.collected).toEqual([3]);
    expect(g.squares).toHaveLength(0);
    expect(scoreOf(g) - before).toBeGreaterThanOrEqual(3 * CONFIG.pointsPerLevel);
  });
});

describe("pace and fairness", () => {
  it("speeds up over time but never past the cap", () => {
    const g = clean();
    const start = g.speed;
    run(g, 5);
    expect(g.speed).toBeGreaterThan(start);
    run(g, 120);
    expect(g.speed).toBe(CONFIG.maxSpeed);
  });

  it("the same seed gives the same course", () => {
    const course = (seed: number) => {
      const g = createGame(W, H, seed);
      press(g);
      const xs: string[] = [];
      for (let i = 0; i < 600; i++) { step(g, 1 / 60); g.phase = "running"; }
      for (const o of g.obstacles) xs.push(`${o.kind}:${Math.round(o.x)}`);
      return xs.join(",");
    };
    expect(course(42)).toBe(course(42));
    expect(course(42)).not.toBe(course(7));
  });

  it("obstacles are always far enough apart to jump", () => {
    const g = createGame(W, H, 3);
    press(g);
    let last: number | null = null;
    for (let i = 0; i < 60 * 90; i++) {
      step(g, 1 / 60);
      g.phase = "running"; // keep the course going to inspect spacing
      const newest = g.obstacles[g.obstacles.length - 1];
      if (newest && newest.x > W && newest.x !== last) {
        const prev = g.obstacles[g.obstacles.length - 2];
        if (prev) expect(newest.x - (prev.x + prev.w)).toBeGreaterThanOrEqual(CONFIG.minGap - 1);
        last = newest.x;
      }
    }
  });

  it("503s only appear after the opening stretch", () => {
    const g = createGame(W, H, 5);
    press(g);
    const kindsEarly = new Set<string>();
    while (g.distance < CONFIG.flyersAfter - 50) { step(g, 1 / 60); g.phase = "running"; for (const o of g.obstacles) kindsEarly.add(o.kind); }
    expect(kindsEarly.has("503")).toBe(false);
  });
});

describe("restart and best score", () => {
  it("a press after game over starts a fresh run and keeps the best score", () => {
    const g = clean();
    run(g, 2);
    g.obstacles.push({ kind: "bug", x: g.player.x + 10, y: g.groundY - 16, w: 18, h: 16 });
    run(g, 1);
    expect(g.phase).toBe("over");
    const best = g.best;
    expect(best).toBeGreaterThan(0);
    press(g);
    expect(g.phase).toBe("running");
    expect(g.distance).toBe(0);
    expect(g.collected).toEqual([]);
    expect(g.best).toBe(best);
  });
});

describe("no impossible combinations", () => {
  it("at every speed, the smallest gap is longer than a full jump, so you land before the next obstacle", () => {
    const airTime = (2 * CONFIG.jumpVelocity) / CONFIG.gravity;
    for (let speed = CONFIG.startSpeed; speed <= CONFIG.maxSpeed; speed += 20) {
      expect(minGapAt(speed)).toBeGreaterThan(airTime * speed);
    }
  });
});

describe("small screens", () => {
  it("narrow game areas run slower, so obstacles stay on screen about as long as on a wide one", () => {
    const crossTime = (width: number) => {
      const g = createGame(width, H, 1);
      press(g);
      return width / g.speed;
    };
    expect(crossTime(340)).toBeGreaterThanOrEqual(crossTime(600) * 0.95);
    const narrow = createGame(340, H, 1);
    press(narrow);
    for (let i = 0; i < 60 * 120; i++) { step(narrow, 1 / 60); narrow.phase = "running"; }
    expect(narrow.speed).toBeLessThan(CONFIG.maxSpeed);
  });

  it("very narrow areas never drop below 55% speed, and wide ones never go above full speed", () => {
    expect(createGame(200, H, 1).speed).toBeCloseTo(CONFIG.startSpeed * 0.55);
    expect(createGame(1200, H, 1).speed).toBe(CONFIG.startSpeed);
  });
});
