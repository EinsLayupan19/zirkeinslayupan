import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { sendContact, validate } from "./contact";
import ContactPage from "./components/ContactPage";
import App from "./App";
import { links } from "./data";

const good = { name: "Ana Reyes", email: "ana@example.com", message: "Hi Eins, we'd like to talk about an internship." };
const respond = (status: number, body: unknown) => vi.fn(async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status }));

describe("validate (same rules as the server)", () => {
  it("accepts a good message", () => expect(validate(good)).toBeNull());
  it("names the field that is wrong", () => {
    expect(validate({ ...good, name: "  " })?.field).toBe("name");
    expect(validate({ ...good, email: "nope" })?.field).toBe("email");
    expect(validate({ ...good, message: "short" })?.field).toBe("message");
  });
});

describe("sendContact", () => {
  it("posts the fields to /api/contact", async () => {
    const f = respond(200, { ok: true });
    expect(await sendContact(good, f)).toEqual({ ok: true });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/contact");
    expect(JSON.parse(init.body as string)).toEqual({ ...good, company: "" });
  });

  it("passes a field error back to the form", async () => {
    const r = await sendContact(good, respond(400, { error: "Please enter a valid email address.", field: "email" }));
    expect(r).toEqual({ ok: false, error: "Please enter a valid email address.", field: "email", useEmail: false });
  });

  it("suggests emailing directly when sending isn't possible", async () => {
    for (const f of [
      respond(503, { error: "The contact form isn't set up yet." }),
      respond(502, { error: "The message couldn't be sent right now." }),
      respond(429, { error: "You've sent several messages already." }),
      respond(404, "<html>not found</html>"),
      vi.fn(async () => { throw new TypeError("offline"); }),
    ]) {
      const r = await sendContact(good, f);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.useEmail).toBe(true);
    }
  });
});

describe("Contact page", () => {
  const html = renderToStaticMarkup(<ContactPage />);

  it("is a page with its own heading", () => {
    expect(html).toMatch(/<h1[^>]*tabindex="-1"[^>]*>Contact<\/h1>/);
  });

  it("lists your email, LinkedIn and GitHub next to the form", () => {
    expect(html).toContain(`href="mailto:${links.email}"`);
    expect(html).toContain(`href="${links.linkedin}"`);
    expect(html).toContain(`href="${links.github}"`);
  });

  it("has labelled name, email and message fields", () => {
    for (const [id, label] of [["contact-name", "Name"], ["contact-email", "Email"], ["contact-message", "Message"]]) {
      expect(html).toContain(`for="${id}"`);
      expect(html).toContain(`>${label}</label>`);
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toMatch(/<input[^>]*type="email"[^>]*id="contact-email"|<input[^>]*id="contact-email"[^>]*type="email"/);
    expect(html).toMatch(/<textarea[^>]*id="contact-message"/);
    expect(html).toContain(">Send message</button>");
  });

  it("hides the bot trap from people and keyboards", () => {
    expect(html).toMatch(/<div class="hp" aria-hidden="true">/);
    expect(html).toMatch(/<input[^>]*name="company"[^>]*tabindex="-1"|<input[^>]*tabindex="-1"[^>]*name="company"/i);
  });
});

describe("the /contact route", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("shows the contact page and not the portfolio", () => {
    vi.stubGlobal("location", { pathname: "/contact" });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('id="contact-name"');
    expect(html).not.toContain("Selected work");
    expect(html).not.toContain("About me");
  });
});
