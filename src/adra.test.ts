import { describe, expect, it, vi } from "vitest";
import { ask, reply } from "./adra";
import { links, projects } from "./data";

describe("Adra contact reply", () => {
  it("points to the listed email and LinkedIn instead of GitHub only", async () => {
    const r = await reply("how can I contact him?");
    expect(r.text).not.toMatch(/best place right now is GitHub/i);
    expect(r.text).toContain(links.email);
    expect(r.links?.map((l) => l.href)).toContain(links.linkedin);
    expect(r.links?.map((l) => l.href)).toContain(`mailto:${links.email}`);
  });
});

describe("Adra project reply", () => {
  it("includes the project summary when one is set", async () => {
    const p = projects.find((x) => x.summary);
    expect(p).toBeDefined();
    const r = await reply(`tell me about ${p!.title}`);
    expect(r.text).toContain(p!.summary!);
  });
});

describe("ask", () => {
  const ok = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));

  it("uses the AI answer from /api/adra when it works", async () => {
    const f = ok({ text: "From Gemini.", links: [{ label: "GitHub", href: links.github }] });
    const r = await ask("hi", [], f);
    expect(r).toEqual({ text: "From Gemini.", links: [{ label: "GitHub", href: links.github }], source: "ai" });
    expect((f.mock.calls[0] as unknown as [string])[0]).toBe("/api/adra");
  });

  it("sends the conversation, dropping the opening greeting", async () => {
    const f = ok({ text: "ok", links: [] });
    await ask("and his stack?", [
      { from: "adra", text: "Hi, I'm Adra." },
      { from: "me", text: "projects?" },
      { from: "adra", text: "InsightFlow and more." },
    ], f);
    const sent = JSON.parse(((f.mock.calls[0] as unknown as [string, RequestInit])[1].body) as string);
    expect(sent.messages).toEqual([
      { role: "user", text: "projects?" },
      { role: "model", text: "InsightFlow and more." },
      { role: "user", text: "and his stack?" },
    ]);
  });

  it("falls back to the site's own answers when the AI is unavailable", async () => {
    for (const f of [
      vi.fn(async () => new Response("{}", { status: 503 })),
      vi.fn(async () => { throw new TypeError("offline"); }),
      vi.fn(async () => new Response("<html>not found</html>", { status: 200 })),
    ]) {
      const r = await ask("how can I contact him?", [], f);
      expect(r.source).toBe("site");
      expect(r.text).toContain(links.email);
    }
  });
});
