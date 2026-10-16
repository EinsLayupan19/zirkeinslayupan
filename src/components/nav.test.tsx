import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Nav from "./Nav";
import App from "../App";
import { links, profile } from "../data";

// Server-render as if the browser were at `pathname` (ThemeToggle reads matchMedia on render).
function stubBrowser(pathname: string) {
  vi.stubGlobal("location", { pathname });
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
}
afterEach(() => vi.unstubAllGlobals());

const anchors = (html: string) => [...html.matchAll(/<a ([^>]*)>(.*?)<\/a>/g)].map(([, attrs, inner]) => ({ attrs, text: inner.replace(/<[^>]+>/g, "") }));
const find = (html: string, text: string) => anchors(html).find((a) => a.text === text);

describe("Nav", () => {
  it("is a labelled navigation landmark", () => {
    stubBrowser("/");
    expect(renderToStaticMarkup(<Nav route="home" />)).toMatch(/<nav[^>]*aria-label="Main"/);
  });

  it("links home with your name, and to Work, About and Contact", () => {
    stubBrowser("/");
    const html = renderToStaticMarkup(<Nav route="home" />);
    expect(anchors(html).some((a) => a.attrs.includes('href="/"') && a.text.includes(profile.name))).toBe(true);
    expect(find(html, "Work")?.attrs).toContain('href="#work"');
    expect(find(html, "About")?.attrs).toContain('href="/about"');
    expect(find(html, "Contact")?.attrs).toContain('href="#contact"');
  });

  it("on the About page, marks About as current and sends Work back to the home page section", () => {
    stubBrowser("/about");
    const html = renderToStaticMarkup(<Nav route="about" />);
    expect(find(html, "About")?.attrs).toContain('aria-current="page"');
    expect(find(html, "Work")?.attrs).toContain('href="/#work"');
    expect(find(html, "Contact")?.attrs).toContain('href="#contact"');
  });

  it("shows Résumé only once a file is set", () => {
    stubBrowser("/");
    expect(Boolean(find(renderToStaticMarkup(<Nav route="home" />), "Résumé"))).toBe(Boolean(links.resume));
  });

  it("keeps the theme toggle", () => {
    stubBrowser("/");
    expect(renderToStaticMarkup(<Nav route="home" />)).toContain('class="theme-btn"');
  });
});

describe("App uses the nav on every page", () => {
  for (const path of ["/", "/about", "/nope"]) {
    it(path, () => {
      stubBrowser(path);
      const html = renderToStaticMarkup(<App />);
      expect(html).toMatch(/<nav[^>]*aria-label="Main"/);
      expect(html).not.toContain('class="back"');
    });
  }
});
