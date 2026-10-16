import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Work from "./Work";
import Footer from "./Footer";
import { links, projects } from "../data";

// React escapes text in markup, so compare against the escaped form.
const escaped = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

describe("Work", () => {
  it("shows each project's summary", () => {
    const html = renderToStaticMarkup(<Work />);
    for (const p of projects) if (p.summary) expect(html).toContain(escaped(p.summary));
  });

  it("does not link to the private TaskFlow repo", () => {
    expect(renderToStaticMarkup(<Work />)).not.toContain("taskfloww");
  });
});

describe("Footer", () => {
  it("opens external profiles in a new tab", () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).toContain(`href="${links.github}" target="_blank"`);
  });

  it("hides the Résumé link until a file is set", () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html.includes("Résumé")).toBe(Boolean(links.resume));
  });
});
