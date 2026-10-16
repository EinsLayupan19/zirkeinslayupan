import { describe, expect, it, vi } from "vitest";
import { handleAdra } from "./_adra";
import { links, projects } from "../src/data";

const KEY = "test-key-not-real";
let n = 0;
const ip = () => `10.0.0.${++n}`; // fresh address per test so the rate limit never interferes

const ask = (text: string) => ({ messages: [{ role: "user", text }] });

function gemini(payload: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(payload), { status }));
}
const answer = (obj: unknown) => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] });

describe("handleAdra", () => {
  it("returns 503 when no API key is configured, without calling Gemini", async () => {
    const f = gemini({});
    const r = await handleAdra({ body: ask("hi"), ip: ip(), env: {}, fetchImpl: f });
    expect(r.status).toBe(503);
    expect(f).not.toHaveBeenCalled();
  });

  it("rejects a malformed body", async () => {
    const f = gemini({});
    for (const body of [null, {}, { messages: [] }, { messages: [{ role: "user", text: "x".repeat(501) }] }, { messages: [{ role: "model", text: "hi" }] }]) {
      const r = await handleAdra({ body, ip: ip(), env: { GEMINI_API_KEY: KEY }, fetchImpl: f });
      expect(r.status).toBe(400);
    }
    expect(f).not.toHaveBeenCalled();
  });

  it("sends the key in a header, never the URL, and returns the answer", async () => {
    const f = gemini(answer({ text: "He built InsightFlow.", links: [] }));
    const r = await handleAdra({ body: ask("what did he build?"), ip: ip(), env: { GEMINI_API_KEY: KEY }, fetchImpl: f });
    expect(r).toEqual({ status: 200, body: { text: "He built InsightFlow.", links: [] } });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain(KEY);
    expect(url).toContain("gemini-3.5-flash-lite:generateContent");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe(KEY);
  });

  it("grounds the model in the site's data", async () => {
    const f = gemini(answer({ text: "ok" }));
    await handleAdra({ body: ask("hi"), ip: ip(), env: { GEMINI_API_KEY: KEY }, fetchImpl: f });
    const sent = JSON.parse(((f.mock.calls[0] as unknown as [string, RequestInit])[1].body) as string);
    const system: string = sent.systemInstruction.parts[0].text;
    for (const p of projects) expect(system).toContain(p.title);
    expect(system).toContain(links.email);
  });

  it("keeps only links that exist on the site", async () => {
    const real = projects[0].repo!;
    const f = gemini(answer({ text: "See the code.", links: [real, "https://evil.example/phish"] }));
    const r = await handleAdra({ body: ask("code?"), ip: ip(), env: { GEMINI_API_KEY: KEY }, fetchImpl: f });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ text: "See the code.", links: [{ label: `${projects[0].title} code`, href: real }] });
  });

  it("skips the model's thinking parts", async () => {
    const f = gemini({ candidates: [{ content: { parts: [{ text: "secret reasoning", thought: true }, { text: JSON.stringify({ text: "Answer." }) }] } }] });
    const r = await handleAdra({ body: ask("hi"), ip: ip(), env: { GEMINI_API_KEY: KEY }, fetchImpl: f });
    expect(r.body).toEqual({ text: "Answer.", links: [] });
  });

  it("retries once when Gemini is busy", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(answer({ text: "Back." })), { status: 200 }));
    const r = await handleAdra({ body: ask("hi"), ip: ip(), env: { GEMINI_API_KEY: KEY }, fetchImpl: f, retryDelayMs: 0 });
    expect(f).toHaveBeenCalledTimes(2);
    expect(r.status).toBe(200);
  });

  it("reports Gemini errors without leaking the key or Google's response", async () => {
    const f = gemini({ error: { message: `bad key ${KEY}` } }, 403);
    const r = await handleAdra({ body: ask("hi"), ip: ip(), env: { GEMINI_API_KEY: KEY }, fetchImpl: f });
    expect(r.status).toBe(502);
    expect(JSON.stringify(r.body)).not.toContain(KEY);
  });

  it("rate-limits one address", async () => {
    const f = gemini(answer({ text: "ok" }));
    const who = ip();
    let last = 0;
    for (let i = 0; i < 21; i++) last = (await handleAdra({ body: ask("hi"), ip: who, env: { GEMINI_API_KEY: KEY }, fetchImpl: f })).status;
    expect(last).toBe(429);
    expect(f).toHaveBeenCalledTimes(20);
  });
});
