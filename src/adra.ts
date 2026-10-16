// Adra's brain in the browser. `ask()` sends the conversation to /api/adra (Gemini, see api/_adra.ts).
// When that isn't available (no API key set, offline, rate-limited) she falls back to `reply()`:
// keyword matching over the site's own data in data.ts, so she only says things already on the page.
import { achievements, categories, certificates, links, profile, projects, stack } from "./data";

export type Reply = { text: string; links?: { label: string; href: string }[] };

export type Turn = { from: "adra" | "me"; text: string };
export type Answer = Reply & { source: "ai" | "site" };

const ASK_TIMEOUT_MS = 20_000;
const MAX_TURNS = 12;

export async function ask(input: string, history: Turn[], fetchImpl: typeof fetch = fetch): Promise<Answer> {
  const turns = [...history, { from: "me" as const, text: input }].slice(-MAX_TURNS);
  while (turns.length && turns[0].from !== "me") turns.shift(); // the API expects the visitor to speak first
  const messages = turns.map((t) => ({ role: t.from === "me" ? "user" : "model", text: t.text.slice(0, 2000) }));
  try {
    const res = await fetchImpl("/api/adra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.timeout(ASK_TIMEOUT_MS),
    });
    if (res.ok) {
      const data = (await res.json()) as { text?: unknown; links?: unknown };
      if (typeof data.text === "string" && data.text) {
        const l = Array.isArray(data.links)
          ? data.links.filter((x): x is { label: string; href: string } => typeof x?.label === "string" && typeof x?.href === "string")
          : [];
        return { text: data.text, links: l, source: "ai" };
      }
    }
  } catch {
    /* offline, timed out, or not JSON: use the site's own answers */
  }
  return { ...(await reply(input)), source: "site" };
}

export const suggestions = ["Projects", "Tech stack", "Certifications", "Contact"];

const has = (q: string, re: RegExp) => re.test(q);

function projectReply(q: string): Reply | null {
  const hit = projects.find((p) => q.includes(p.title.toLowerCase()));
  if (!hit) return null;
  const lines = [`${hit.title}: ${hit.description}.`];
  if (hit.summary) lines.push(hit.summary);
  if (hit.role) lines.push(`Eins's role: ${hit.role}.`);
  if (hit.tech?.length) lines.push(`Built with ${hit.tech.join(", ")}.`);
  const out: Reply = { text: lines.join(" ") };
  const l: { label: string; href: string }[] = [];
  if (hit.demo) l.push({ label: "Live site", href: hit.demo });
  if (hit.repo) l.push({ label: "Code", href: hit.repo });
  if (l.length) out.links = l;
  return out;
}

export async function reply(input: string): Promise<Reply> {
  const q = input.toLowerCase().trim();
  if (!q) return { text: "Ask me about Eins's projects, tech stack, certifications or how to reach him." };

  const proj = projectReply(q);
  if (proj) return proj;

  if (has(q, /^(hi|hello|hey|yo|kumusta|hola)\b/))
    return { text: "Hi, I'm Adra. I can tell you about Eins's projects, tech stack, certifications and contact details." };

  if (has(q, /achiev|award|win|won|capstone|recogni/)) {
    if (!achievements.length) return { text: "No achievements listed yet." };
    return { text: achievements.map((a) => `${a.title}${a.detail ? ` (${a.detail})` : ""}`).join(". ") + "." };
  }

  if (has(q, /project|work|built|build|portfolio|made/)) {
    const cat = categories.find((c) => q.includes(c.label.toLowerCase().split(" ")[0]) || (c.id === "ai" && /\bai\b/.test(q)));
    const list = cat ? projects.filter((p) => p.categories.includes(cat.id)) : projects;
    if (!list.length) return { text: `No ${cat?.label} projects yet.` };
    return {
      text: (cat ? `${cat.label} projects: ` : "Projects: ") + list.map((p) => `${p.title} - ${p.description}`).join("; ") + ". Ask about any of them for details.",
    };
  }

  if (has(q, /stack|tech|tool|skill|language|framework|use\b/))
    return { text: `Eins's stack: ${stack.join(", ")}.` };

  if (has(q, /cert|course|credential|badge/)) {
    if (!certificates.length) return { text: "No certifications listed yet." };
    return {
      text: "Certifications: " + certificates.map((c) => `${c.title} (${c.issuer})`).join("; ") + ".",
      links: certificates.slice(0, 2).map((c) => ({ label: c.title, href: c.href })),
    };
  }

  if (has(q, /github|repo|code|contribution|commit/))
    return { text: `Eins's code is on GitHub as ${links.githubHandle}.`, links: [{ label: "GitHub", href: links.github }] };

  if (has(q, /contact|email|mail|hire|reach|linkedin|message|touch/)) {
    const l: { label: string; href: string }[] = [];
    if (links.email) l.push({ label: "Email", href: `mailto:${links.email}` });
    if (links.linkedin) l.push({ label: "LinkedIn", href: links.linkedin });
    l.push({ label: "GitHub", href: links.github });
    const text = links.email
      ? `Email is the quickest way: ${links.email}. He's also on LinkedIn and GitHub.`
      : "Reach him on GitHub for now.";
    return { text, links: l };
  }

  if (has(q, /who|about|eins|name|student|school|study|yourself|role/))
    return { text: `${profile.name}: ${profile.roles.join(", ")}. A third-year BSIT student at Northeastern University Philippines who works on full-stack apps, AI automation and data analytics.` };

  if (has(q, /adra|you|bot|ai|real/))
    return { text: "I'm Adra, the assistant on Eins's site. Right now I'm answering from this site's content." };

  if (has(q, /help|what can/))
    return { text: "Try asking about projects, a specific project like EagleDesk, the tech stack, certifications, achievements, or contact." };

  return { text: "I can't answer that one right now. Try asking about projects, tech stack, certifications or contact." };
}
