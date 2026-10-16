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
- `projects`: add `href` to make a card clickable
- `achievements`: add real entries only; the "Coming soon" card hides itself once the list has items
- `stack`: the chips

Replace `public/photo.jpg` to change the portrait (4:5 works best).

## Deploy
Push to GitHub, import the repo in Vercel. Framework preset: Vite. No config needed.
