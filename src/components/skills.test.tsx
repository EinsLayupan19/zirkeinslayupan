import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Skills from "./Skills";
import { softSkills, stack, stackGroups } from "../data";
import { reply } from "../adra";

const escaped = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

describe("Skills section", () => {
  const html = renderToStaticMarkup(<Skills />);

  it("is a Skills section the page can link to", () => {
    expect(html).toMatch(/<section[^>]*id="skills"/);
    expect(html).toContain(">Skills</h2>");
  });

  it("shows every technical skill under its group", () => {
    for (const g of stackGroups) expect(html).toContain(`>${escaped(g.label)}<`);
    for (const t of stack) expect(html).toContain(`>${escaped(t)}<`);
  });

  it("shows how you work: teamwork from the HR System, and willingness to learn", () => {
    expect(softSkills.map((s) => s.name)).toEqual(["Teamwork", "Willing to learn"]);
    for (const s of softSkills) {
      expect(html).toContain(escaped(s.name));
      if (s.detail) expect(html).toContain(escaped(s.detail));
    }
    expect(softSkills[0].detail).toContain("HR System");
  });
});

describe("Adra knows the skills", () => {
  it("lists the technical skills and the soft skills", async () => {
    const r = await reply("what are his skills?");
    expect(r.text).toContain("Python");
    expect(r.text).toContain("Teamwork");
    expect(r.text).toContain("Willing to learn");
  });
});
