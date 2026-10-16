import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "../App";
import Footer from "../components/Footer";
import { routeOf } from "../router";

function renderAt(pathname: string) {
  vi.stubGlobal("location", { pathname });
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
  return renderToStaticMarkup(<App />);
}
afterEach(() => vi.unstubAllGlobals());

describe("Green Squares pages", () => {
  it("/play is its own page", () => {
    expect(routeOf("/play")).toBe("play");
    expect(routeOf("/play/")).toBe("play");
  });

  it("/play shows the title, how to play, the game and an empty graph", () => {
    const html = renderAt("/play");
    expect(html).toMatch(/<h1[^>]*tabindex="-1"[^>]*>Green Squares<\/h1>/);
    expect(html).toContain("Jump the bugs");
    expect(html).toMatch(/role="application"[^>]*aria-label="Green Squares game\. Press Space, Up arrow or W to jump, or tap\. Hold to jump higher\."/);
    expect(html.match(/class="cell" data-g="0"/g)).toHaveLength(140);
    expect(html).toContain("0 squares this run");
    expect(html).not.toContain("Selected work");
  });

  it("the Page not found page offers a round of the game", () => {
    const html = renderAt("/definitely-not-a-page");
    expect(html).toContain("Page not found");
    expect(html).toContain('role="application"');
  });

  it("the home page does not load the game", () => {
    expect(renderAt("/")).not.toContain('role="application"');
  });

  it("the footer links to the game", () => {
    expect(renderToStaticMarkup(<Footer />)).toMatch(/<a href="\/play"[^>]*>Play<\/a>/);
  });
});
