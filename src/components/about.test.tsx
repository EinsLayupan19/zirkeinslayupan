import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AboutPage from "./AboutPage";
import App from "../App";
import Profile from "./Profile";
import Stats from "./Stats";
import { about, achievements, certificates, profile, projects, stack, stackGroups } from "../data";
import { routeOf } from "../router";
import { reply } from "../adra";

// React escapes text in markup, so compare against the escaped form.
const escaped = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

describe("routes", () => {
  it("maps paths to pages", () => {
    expect(routeOf("/")).toBe("home");
    expect(routeOf("/about")).toBe("about");
    expect(routeOf("/about/")).toBe("about");
    expect(routeOf("/nope")).toBe("notfound");
  });
});

describe("home page links to About", () => {
  it("'More about me' goes to /about", () => {
    const html = renderToStaticMarkup(<Profile />);
    expect(html).toMatch(/<a[^>]*href="\/about"[^>]*>.*More about me/);
    expect(html).not.toContain("aria-expanded");
  });

  it("the student stat goes to /about", () => {
    expect(renderToStaticMarkup(<Stats />)).toContain('href="/about"');
  });
});

describe("About page", () => {
  const html = renderToStaticMarkup(<AboutPage />);

  it("is about you: bio and school", () => {
    for (const line of profile.bio) expect(html).toContain(escaped(line));
    expect(html).toContain(escaped(about.education.school));
  });

  it("does not repeat the portfolio: no projects, tools, certifications or awards", () => {
    for (const p of projects) expect(html).not.toContain(escaped(p.title));
    for (const g of stackGroups) expect(html).not.toContain(`>${escaped(g.label)}<`);
    for (const t of stack) expect(html).not.toContain(`>${escaped(t)}<`);
    for (const c of certificates) expect(html).not.toContain(escaped(c.title));
    for (const a of achievements) expect(html).not.toContain(escaped(a.title));
  });

  it("hides My story and Hobbies while they are empty", () => {
    const empty = renderToStaticMarkup(<AboutPage content={{ ...about, story: [], hobbies: [] }} />);
    expect(empty).not.toContain("My story");
    expect(empty).not.toContain("Hobbies");
  });

  it("shows your story and hobbies once you add them", () => {
    const filled = renderToStaticMarkup(
      <AboutPage content={{ ...about, story: ["Sample paragraph."], hobbies: [{ name: "Sample hobby", detail: "Sample detail." }, { name: "Another" }] }} />
    );
    expect(filled).toContain("My story");
    expect(filled).toContain("Sample paragraph.");
    expect(filled).toContain("Hobbies");
    expect(filled).toContain("Sample hobby");
    expect(filled).toContain("Sample detail.");
    expect(filled).toContain("Another");
  });
});

describe("facts", () => {
  it("uses the school from the EagleDesk README everywhere", async () => {
    expect(about.education.school).toBe("New Era University");
    expect(JSON.stringify(profile)).not.toContain("Northeastern");
    expect((await reply("who is he?")).text).toContain("New Era University");
  });

  it("does not claim pgvector (EagleDesk does not use it)", () => {
    expect(stack).not.toContain("pgvector");
    for (const p of projects) expect(p.tech ?? []).not.toContain("pgvector");
  });

  it("the stack list is the grouped list, flattened, with no duplicates", () => {
    expect(stack).toEqual(stackGroups.flatMap((g) => g.items));
    expect(new Set(stack).size).toBe(stack.length);
  });
});

describe("the app at each path", () => {
  // Server-render the whole app as if the browser were at `pathname` (ThemeToggle reads matchMedia on render).
  function renderAt(pathname: string) {
    vi.stubGlobal("location", { pathname });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
    return renderToStaticMarkup(<App />);
  }
  afterEach(() => vi.unstubAllGlobals());

  it("/about shows the About page with a way home (the name in the nav) and the footer", () => {
    const html = renderAt("/about");
    expect(html).toContain("About me");
    expect(html).toMatch(/<a (?=[^>]*class="brand")(?=[^>]*href="\/")[^>]*>/);
    expect(html).toContain('id="contact"');
  });

  it("/ shows the portfolio", () => {
    const html = renderAt("/");
    expect(html).toContain("Selected work");
  });

  it("an unknown path says so and links to both pages", () => {
    const html = renderAt("/nope");
    expect(html).toContain("Page not found");
    expect(html).toContain('href="/about"');
    expect(html).not.toContain("Selected work");
  });
});

describe("hobbies", () => {
  it("shows the intro line and marks the main sport", () => {
    const html = renderToStaticMarkup(
      <AboutPage content={{ ...about, hobbiesIntro: "Sample intro.", hobbies: [{ name: "Main one", main: true }, { name: "Other" }] }} />
    );
    expect(html).toContain("Sample intro.");
    expect(html).toMatch(/<li class="main">.*Main one/);
    expect(html).toMatch(/<li>.*Other/);
  });

  it("the real page lists every hobby you gave", () => {
    const html = renderToStaticMarkup(<AboutPage />);
    for (const h of about.hobbies) expect(html).toContain(escaped(h.name));
    for (const p of about.story) expect(html).toContain(escaped(p));
  });

  it("Adra answers hobby questions from the same data", async () => {
    const r = await reply("what are his hobbies?");
    for (const h of about.hobbies) expect(r.text).toContain(h.name);
    expect((await reply("does he play sports?")).text).toContain(about.hobbies[0].name);
  });
});
