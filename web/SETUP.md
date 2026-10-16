# Web (React + Vite + Tailwind)

Owner: Pauline. Repo manager: Lenon.

The Vite project is NOT generated yet, so run this once from the repo root:

```bash
cd web
npm create vite@latest . -- --template react
npm install
npm install react-router-dom axios recharts leaflet react-leaflet
npm install tailwindcss @tailwindcss/vite
```

Then follow the current Tailwind + Vite guide at tailwindcss.com to enable the plugin.

Create `.env` from `.env.example`, then run `npm run dev`.

Suggested folders under `src/`: `api/`, `components/`, `context/`, `pages/`, `routes/`.
Pages: Login, Dashboard, Reports, ReportDetails, OfficerQueue, Users, Exports.

## Demo video page

Add a "Demo Video" page that reads `GET /api/app-info` and plays `demoVideoUrl` in a `<video controls>` tag.
If `demoVideoUrl` is null, show "Video coming soon". Build this before the Oct 30 freeze.
