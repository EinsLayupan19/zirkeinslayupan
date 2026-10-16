// The contact form's browser side. Same validation rules as api/_contact.ts, so most mistakes are caught
// before anything is sent; the server checks again either way.
export type ContactField = "name" | "email" | "message";
export type ContactFields = { name: string; email: string; message: string; company?: string };
export type SendResult = { ok: true } | { ok: false; error: string; field?: ContactField; useEmail: boolean };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TIMEOUT_MS = 15_000;

export function validate(f: ContactFields): { field: ContactField; error: string } | null {
  const name = f.name.trim();
  const email = f.email.trim();
  const message = f.message.trim();
  if (!name || name.length > 100) return { field: "name", error: "Please enter your name." };
  if (email.length > 254 || !EMAIL.test(email)) return { field: "email", error: "Please enter a valid email address." };
  if (message.length < 10) return { field: "message", error: "Please write a little more (at least 10 characters)." };
  if (message.length > 5000) return { field: "message", error: "Please keep it under 5,000 characters." };
  return null;
}

export async function sendContact(f: ContactFields, fetchImpl: typeof fetch = fetch): Promise<SendResult> {
  const unavailable: SendResult = { ok: false, error: "Your message couldn't be sent right now.", useEmail: true };
  try {
    const res = await fetchImpl("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.name, email: f.email, message: f.message, company: f.company ?? "" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: unknown; field?: unknown } | null;
    if (res.ok && data?.ok) return { ok: true };
    const error = typeof data?.error === "string" ? data.error : unavailable.error;
    if (res.status === 400) {
      const field = data?.field === "name" || data?.field === "email" || data?.field === "message" ? data.field : undefined;
      return { ok: false, error, field, useEmail: false };
    }
    return { ok: false, error: data ? error : unavailable.error, useEmail: true };
  } catch {
    return unavailable;
  }
}
