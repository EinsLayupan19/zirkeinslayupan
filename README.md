# Zirk Eins B. Layupan: Portfolio

React + Vite + TypeScript. Plain CSS, no UI library.

## Run
```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build into dist/
npm run preview  # serve the build locally
```

## Edit content
Everything lives in `src/data.ts`:
- `links.linkedin` and `links.email`: paste yours, the footer links appear automatically
- `links.resume`: put your CV at `public/resume.pdf` and set `"/resume.pdf"`; a Résumé link appears in the nav, under your name and in the footer
- `profile.availability`: one line under your name, e.g. "Open to internships, 2026"
- `projects`: add `demo` (live site) or `repo` (code) to make a card clickable, and `image` for a screenshot
- `achievements`: add real entries only; the "Coming soon" card hides itself once the list has items
- `stackGroups`: your tools, shown as one list on the home page
- `about`: the About page (`/about`), which is about you, not your work. Add `story` paragraphs and `hobbies` (`{ name, detail? }`); each section stays hidden until it has something

## Pages
`/` (portfolio) and `/about`. Navigation is in `src/components/Nav.tsx`; routing is the small `src/router.ts` (no
library). `vercel.json` sends every non-API path to the app so `/about` works when opened directly.

Replace `public/photo.jpg` to change the portrait (4:5 works best).

## Deploy
Push to GitHub, import the repo in Vercel. Framework preset: Vite. No config needed.
