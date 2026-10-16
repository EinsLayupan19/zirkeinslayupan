import { describe, expect, it, vi } from "vitest";
import { handleContact } from "./_contact";
import { links } from "../src/data";

const KEY = "re_test_not_real";
let n = 0;
const ip = () => `10.1.0.${++n}`; // fresh address per test so the rate limit never interferes

const good = { name: "Ana Reyes", email: "ana@example.com", message: "Hi Eins, we'd like to talk about an internship." };
const ok = () => vi.fn(async () => new Response(JSON.stringify({ id: "email_123" }), { status: 200 }));
const sent = (f: ReturnType<typeof vi.fn>) => {
  const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
  return { url, headers: init.headers as Record<string, string>, body: JSON.parse(init.body as string) };
};

describe("handleContact", () => {
  it("returns 503 when email sending is not set up, without calling Resend", async () => {
    const f = ok();
    const r = await handleContact({ body: good, ip: ip(), env: {}, fetchImpl: f });
    expect(r.status).toBe(503);
    expect(f).not.toHaveBeenCalled();
  });

  it("rejects bad input and says which field", async () => {
    const f = ok();
    const cases: [unknown, string][] = [
      [{ ...good, name: "" }, "name"],
      [{ ...good, name: "x".repeat(101) }, "name"],
      [{ ...good, email: "not-an-email" }, "email"],
      [{ ...good, email: "a@b" }, "email"],
      [{ ...good, message: "short" }, "message"],
      [{ ...good, message: "x".repeat(5001) }, "message"],
    ];
    for (const [body, field] of cases) {
      const r = await handleContact({ body, ip: ip(), env: { RESEND_API_KEY: KEY }, fetchImpl: f });
      expect(r.status).toBe(400);
      expect(r.body).toMatchObject({ field });
    }
    expect((await handleContact({ body: null, ip: ip(), env: { RESEND_API_KEY: KEY }, fetchImpl: f })).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it("quietly drops bots that fill the hidden field", async () => {
    const f = ok();
    const r = await handleContact({ body: { ...good, company: "Spam Inc" }, ip: ip(), env: { RESEND_API_KEY: KEY }, fetchImpl: f });
    expect(r).toEqual({ status: 200, body: { ok: true } });
    expect(f).not.toHaveBeenCalled();
  });

  it("emails the message to you, with Reply going to the visitor", async () => {
    const f = ok();
    const r = await handleContact({ body: good, ip: ip(), env: { RESEND_API_KEY: KEY }, fetchImpl: f });
    expect(r).toEqual({ status: 200, body: { ok: true } });
    const { url, headers, body } = sent(f);
    expect(url).toBe("https://api.resend.com/emails");
    expect(headers.Authorization).toBe(`Bearer ${KEY}`);
    expect(url).not.toContain(KEY);
    expect(body.to).toEqual([links.email]);
    expect(body.reply_to).toBe(good.email);
    expect(body.from).toContain("onboarding@resend.dev");
    expect(body.subject).toContain(good.name);
    expect(body.text).toContain(good.message);
    expect(body.text).toContain(good.email);
    expect(body.html).toBeUndefined(); // plain text only: nothing the visitor types is rendered as HTML
  });

  it("sends to CONTACT_TO when set", async () => {
    const f = ok();
    await handleContact({ body: good, ip: ip(), env: { RESEND_API_KEY: KEY, CONTACT_TO: "other@example.com" }, fetchImpl: f });
    expect(sent(f).body.to).toEqual(["other@example.com"]);
  });

  it("keeps line breaks out of the subject (no header injection)", async () => {
    const f = ok();
    await handleContact({ body: { ...good, name: "Ana\r\nBcc: victim@example.com" }, ip: ip(), env: { RESEND_API_KEY: KEY }, fetchImpl: f });
    expect(sent(f).body.subject).not.toMatch(/[\r\n]/);
  });

  it("reports a Resend failure without leaking the key or Resend's response", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ message: `bad key ${KEY}` }), { status: 403 }));
    const r = await handleContact({ body: good, ip: ip(), env: { RESEND_API_KEY: KEY }, fetchImpl: f });
    expect(r.status).toBe(502);
    expect(JSON.stringify(r.body)).not.toContain(KEY);
  });

  it("reports a network failure as 504", async () => {
    const f = vi.fn(async () => { throw new TypeError("offline"); });
    expect((await handleContact({ body: good, ip: ip(), env: { RESEND_API_KEY: KEY }, fetchImpl: f })).status).toBe(504);
  });

  it("allows 5 messages per hour from one address", async () => {
    const f = ok();
    const who = ip();
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await handleContact({ body: good, ip: who, env: { RESEND_API_KEY: KEY }, fetchImpl: f })).status);
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
    expect(f).toHaveBeenCalledTimes(5);
  });
});
