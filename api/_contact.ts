// The contact form's server side: validates the message and emails it to you through Resend (resend.com).
// Runs only on the server (Vercel function api/contact.ts, or the dev middleware in vite.config.ts), so the
// RESEND_API_KEY never reaches the browser. Plain-text email only; Reply goes to the visitor's address.
import { links, profile } from "../src/data";

export type ContactEnv = { RESEND_API_KEY?: string; CONTACT_TO?: string };
type Field = "name" | "email" | "message";
export type ContactResult = { status: number; body: { ok: true } | { error: string; field?: Field } };

// Resend's shared test sender. It can deliver only to the email address that owns the Resend account, so sign up
// with the address the messages should reach (or verify your own domain in Resend and change this).
const FROM = "Portfolio contact <onboarding@resend.dev>";
const TIMEOUT_MS = 10_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Best effort per-address limit. On Vercel each warm instance keeps its own count.
const LIMIT = 5;
const WINDOW_MS = 60 * 60_000;
const hits = new Map<string, number[]>();

function limited(ip: string, now: number): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

const fail = (status: number, error: string, field?: Field): ContactResult => ({ status, body: field ? { error, field } : { error } });

export async function handleContact(input: {
  body: unknown;
  ip: string;
  env: ContactEnv;
  fetchImpl?: typeof fetch;
  now?: number;
}): Promise<ContactResult> {
  const { env, fetchImpl = fetch } = input;
  const b = (input.body && typeof input.body === "object" ? input.body : null) as Record<string, unknown> | null;
  if (!b) return fail(400, "Send your name, email and message.");

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (!name || name.length > 100) return fail(400, "Please enter your name (up to 100 characters).", "name");
  if (email.length > 254 || !EMAIL.test(email)) return fail(400, "Please enter a valid email address.", "email");
  if (message.length < 10 || message.length > 5000) return fail(400, "Please write a message of 10 to 5,000 characters.", "message");

  // Hidden field that people never see. Bots fill it; pretend it worked so they don't retry.
  if (typeof b.company === "string" && b.company.trim()) return { status: 200, body: { ok: true } };

  const key = env.RESEND_API_KEY?.trim();
  if (!key) return fail(503, "The contact form isn't set up yet.");
  if (limited(input.ip, input.now ?? Date.now())) return fail(429, "You've sent several messages already. Please try again later.");

  const to = env.CONTACT_TO?.trim() || links.email;
  const oneLine = name.replace(/[\r\n]+/g, " ");
  let res: Response;
  try {
    res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        reply_to: email,
        subject: `Portfolio message from ${oneLine}`,
        text: `${message}\n\n---\nFrom: ${oneLine} <${email}>\nSent from the contact form on ${profile.name}'s portfolio.`,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return fail(504, "The message couldn't be sent right now.");
  }
  // Resend's error body is never passed on.
  if (!res.ok) return fail(502, "The message couldn't be sent right now.");
  return { status: 200, body: { ok: true } };
}
