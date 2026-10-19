# Web (React + Vite + Tailwind)

Owner: Pauline. Repo manager: Lenon.

The Vite project is generated (React 19, Vite 6, Tailwind CSS 4 through `@tailwindcss/vite`).
Code conventions, tokens and folder layout: `web/CLAUDE.md`.

## Run it

```bash
cd web
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev               # http://localhost:5173
```

Checks (the same ones CI runs): `npm run lint` and `npm run build`.

The API must be running (`cd api && npm run dev`) for sign-in and data. Without it, the public
landing page still opens and the other screens show their error states.

## Design source

Screens and components are built from the Figma high-fidelity prototype (Foundations, Components,
Web and Flows pages). Frame IDs: `docs/ui-design/figma-index.md`. Colors and type come from
`src/styles/tokens.css`, generated from the Figma variables, so light and dark mode match the design.

## Demo video page

`/demo-video` reads `GET /api/app-info` and plays `demoVideoUrl` in a `<video controls>` tag.
If `demoVideoUrl` is null it shows the "Video coming soon" empty state.

## Deploy (Vercel)

Root directory `web`, build command `npm run build`, output `dist`, env `VITE_API_URL` set to the
Render API URL plus `/api`. Add a rewrite of all paths to `/index.html` so deep links work.
